import express from 'express';
import path from 'path';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import aiRoutes from './server/routes/ai';
import fs from 'fs';

import { DATABASE_ID, DB_PROJECT_ID, AUTH_PROJECT_ID } from './server/constants/config';

dotenv.config();

// Self-healing icon copies for PWA compatibility and pre-cache safety
try {
  const publicDir = path.join(process.cwd(), 'public');
  const logoPwaPath = path.join(publicDir, 'logo_pwa.png');
  if (fs.existsSync(logoPwaPath)) {
    const faviconPath = path.join(publicDir, 'favicon.ico');
    const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
    const appleIconPrecom = path.join(publicDir, 'apple-touch-icon-precomposed.png');
    
    if (!fs.existsSync(faviconPath)) {
      fs.copyFileSync(logoPwaPath, faviconPath);
      console.log('✅ PWA: Copied logo_pwa.png to favicon.ico');
    }
    if (!fs.existsSync(appleIconPath)) {
      fs.copyFileSync(logoPwaPath, appleIconPath);
      console.log('✅ PWA: Copied logo_pwa.png to apple-touch-icon.png');
    }
    if (!fs.existsSync(appleIconPrecom)) {
      fs.copyFileSync(logoPwaPath, appleIconPrecom);
    }
  }
} catch (iconErr) {
  console.warn('⚠️ Non-fatal: Failed to ensure fallback icon files:', iconErr);
}

// Register global error catchers to prevent unhandled rejections or uncaught exceptions from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 [Unhandled Promise Rejection]:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🔥 [Uncaught Exception]:', error);
});

// Initialize Firebase Admin
let adminApp: admin.app.App | null = null;
let authApp: admin.app.App | null = null;

let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson && fs.existsSync(path.join(process.cwd(), 'service_account.json'))) {
  serviceAccountJson = fs.readFileSync(path.join(process.cwd(), 'service_account.json'), 'utf8');
}
const hasServiceAccount = serviceAccountJson && !serviceAccountJson.includes('...');

// Primary Admin App (for Firestore permissions)
if (admin.apps.length === 0) {
  try {
    if (hasServiceAccount) {
      const sa = JSON.parse(serviceAccountJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: sa.project_id
      });
      console.log('✅ Firebase Admin: Inicializado com Service Account.');
    } else {
      const initOptions: admin.AppOptions = {
        projectId: DB_PROJECT_ID
      };
      try {
        initOptions.credential = admin.credential.applicationDefault();
      } catch (credErr) {
        console.warn('⚠️ Firebase Admin default credentials check failed, using project fallback:', credErr);
      }
      adminApp = admin.initializeApp(initOptions);
      console.log('✅ Firebase Admin: Inicializado com projeto:', DB_PROJECT_ID);
    }
  } catch (err) {
    console.error('❌ Firebase Admin: Erro na inicialização do app principal:', err);
  }
}

// Auth-specific App (to avoid audience mismatch if environment project != auth project)
try {
  const authConfig: admin.AppOptions = { projectId: AUTH_PROJECT_ID };
  if (hasServiceAccount) {
    const sa = JSON.parse(serviceAccountJson as string);
    authConfig.credential = admin.credential.cert(sa);
  } else {
    try {
      authConfig.credential = admin.credential.applicationDefault();
    } catch (credErr) {
      console.warn('⚠️ Firebase Auth default credentials check failed:', credErr);
    }
  }
  authApp = admin.initializeApp(authConfig, 'auth');
  console.log('✅ Firebase Auth App: Inicializado para o projeto:', AUTH_PROJECT_ID);
} catch (err) {
  console.warn('⚠️ Firebase Auth App: Já inicializado ou erro:', err);
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return new Stripe(key || 'sk_test_placeholder');
};

const getDb = () => {
  try {
    const currentDbId = DATABASE_ID;
    const currentProjId = DB_PROJECT_ID;
    
    // Log apenas uma vez ou em depuração
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Firestore Admin] Inicializando DB. Proj: ${currentProjId}, DB ID: ${currentDbId || '(default)'}`);
    }

    if (currentDbId && currentDbId !== '(default)' && currentDbId !== '') {
      return getFirestore(admin.app(), currentDbId);
    }
    return getFirestore();
  } catch (e) {
    console.warn(`⚠️ Firestore Admin: Falha ao obter banco, tentando fallback...`, e);
    return getFirestore();
  }
};

app.set('trust proxy', true);
app.use(cors());

// Webhook
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const stripe = getStripe();
  let event;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const db = getDb();
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType || 'pro';
    const customerEmail = session.customer_details?.email || session.customer_email;
    const stripeCustomerId = session.customer as string;

    if (userId || customerEmail) {
      try {
        let userDocRef = null;
        if (userId) {
          userDocRef = db.collection('users').doc(userId);
        } else if (customerEmail) {
          const snapshot = await db.collection('users').where('email', '==', customerEmail).limit(1).get();
          if (!snapshot.empty) userDocRef = snapshot.docs[0].ref;
        }

        if (userDocRef) {
          await userDocRef.update({
            userPlan: planType,
            stripeCustomerId: stripeCustomerId || '',
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      } catch (dbErr) {
        console.error(`❌ [Webhook] Error:`, dbErr);
      }
    }
  }
  res.json({ received: true });
});

app.use(express.json({ limit: '50mb' }));

/**
 * Middleware para validar o App Check
 * Protege contra acessos não autorizados fora do app
 */
const validateAppCheck = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const appCheckToken = req.header('X-Firebase-AppCheck');
  if (!appCheckToken) {
    // Em desenvolvimento, podemos ignorar se não houver token
    if (process.env.NODE_ENV !== 'production') return next();
    return res.status(401).json({ error: 'Faltando token do App Check' });
  }

  try {
    const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
    // Token válido
    return next();
  } catch (err) {
    console.error('App Check Token Invalido:', err);
    return res.status(401).json({ error: 'Token do App Check inválido ou expirado' });
  }
};

// Endpoint para disparar notificações (Exemplo de uso interno)
app.post('/api/notify', async (req, res) => {
  const { userId, title, body, icon } = req.body;
  const db = getDb();

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return res.status(400).json({ error: 'Usuário não possui token de notificação registrado' });

    const message = {
      notification: {
        title: title || 'Stratis Planner',
        body: body || 'Chegou a hora dos seus estudos!',
      },
      token: fcmToken,
      webpush: {
        notification: {
          icon: icon || '/logo_pwa.png',
        }
      }
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('Erro ao enviar notificação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para envio direto de email via Resend (Alternativa à extensão do Firebase)
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text, from } = req.body;
  if (!to || !subject) return res.status(400).json({ error: 'Faltam campos obrigatórios para envio de email' });
  
  try {
    const data = await resend.emails.send({
      from: from || 'Stratis Planner <suporte@stratisplanner.com.br>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro ao enviar email diretamente via Resend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

  try {
    const rawLink = await admin.auth().generatePasswordResetLink(email);
    const url = new URL(rawLink);
    url.host = 'www.stratisplanner.com.br';
    const link = url.toString();
    
    // Configura o email
    const subject = 'Redefinição de Senha - Stratis Planner';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Redefina sua senha</h2>
        <p>Você solicitou a redefinição da sua senha no Stratis Planner.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redefinir Senha</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Se você não solicitou essa alteração, ignore este e-mail.</p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'Stratis Planner <suporte@stratisplanner.com.br>',
      to: [email],
      subject,
      html,
    });

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.json({ success: true, message: 'Link de recuperação enviado com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao gerar/enviar reset de senha:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

  try {
    const rawLink = await admin.auth().generateEmailVerificationLink(email);
    const url = new URL(rawLink);
    url.host = 'www.stratisplanner.com.br';
    const link = url.toString();
    
    // Configura o email
    const subject = 'Verifique seu E-mail - Stratis Planner';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bem-vindo(a) ao Stratis Planner!</h2>
        <p>Para concluir seu cadastro, por favor verifique seu endereço de e-mail.</p>
        <p>Clique no botão abaixo para verificar:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verificar E-mail</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Se você não se cadastrou no Stratis Planner, ignore este e-mail.</p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'Stratis Planner <suporte@stratisplanner.com.br>',
      to: [email],
      subject,
      html,
    });

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.json({ success: true, message: 'Link de verificação enviado com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao gerar/enviar verificação de e-mail:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mount modular routes
app.use('/api/ai', aiRoutes);

// Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const db = getDb();
    const { priceId: planKey, userId, userEmail } = req.body;

    if (userId) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const emailToCheck = (userData?.email || userEmail || '').toLowerCase().trim();
          const currentPlan = userData?.userPlan;
          if (currentPlan === 'pro' || currentPlan === 'annual' || currentPlan === 'monthly') {
            if (currentPlan === 'pro' || currentPlan === 'annual') throw new Error('Você já possui uma assinatura Premium Anual ativa.');
            if (currentPlan === 'monthly' && planKey === 'monthly_plan') throw new Error('Você já possui uma assinatura mensal ativa.');
          }
        }
      } catch (dbError: any) {
        console.warn('⚠️ Firestore Admin Warning: Não foi possível checar o plano atual no banco:', dbError.message || dbError);
        // If it was a user-facing premium active error thrown by us, bubble it up
        if (dbError.message?.includes('Você já possui')) {
          throw dbError;
        }
      }
    }

    const stripe = getStripe();
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey === '' || stripeKey.includes('placeholder')) {
      throw new Error('Chave secreta do Stripe (STRIPE_SECRET_KEY) não está configurada ou é inválida. Por favor, configure o seu valor real no menu Configurações.');
    }

    let stripePriceId = planKey;
    if (planKey === 'monthly_plan' || planKey === 'price_1TXNEaGqodgUicbTYG0SPo4j') {
      stripePriceId = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1TXNEaGqodgUicbTYG0SPo4j';
    } else if (planKey === 'annual_plan' || planKey === 'price_1TXOHnGqodgUicbTyhPXiUYO') {
      stripePriceId = process.env.STRIPE_ANNUAL_PRICE_ID || 'price_1TXOHnGqodgUicbTyhPXiUYO';
    }

    if (!stripePriceId) {
      throw new Error('ID do plano não configurado (STRIPE_MONTHLY_PRICE_ID ou STRIPE_ANNUAL_PRICE_ID).');
    }

    const baseOrigin = req.body.originURL || process.env.VITE_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseOrigin}/perfil?success=true`,
      cancel_url: `${baseOrigin}/planos?canceled=true`,
      metadata: { userId, planType: planKey === 'annual_plan' ? 'annual' : 'monthly' },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Stripe Customer Portal Session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { userId, userEmail, originURL } = req.body;

    if (!userEmail) {
      throw new Error('E-mail do usuário é obrigatório.');
    }

    const db = getDb();
    const stripe = getStripe();
    let customerId = '';

    // Try to get customerId from Firestore
    if (userId) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          customerId = userDoc.data()?.stripeCustomerId || '';
        }
      } catch (dbError: any) {
        console.warn('⚠️ Firestore Admin Warning: Não foi possível checar stripeCustomerId no banco:', dbError.message || dbError);
      }
    }

    // Fallback: search Stripe for a customer with this email
    if (!customerId) {
      try {
        const customers = await stripe.customers.list({
          email: userEmail.toLowerCase().trim(),
          limit: 1,
        });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          
          // Update Firestore for future quick lookup
          if (userId) {
            await db.collection('users').doc(userId).update({
              stripeCustomerId: customerId,
            }).catch(() => {});
          }
        }
      } catch (stripeError: any) {
        console.error('❌ Error finding customer in Stripe:', stripeError);
      }
    }

    if (!customerId) {
      throw new Error('Nenhuma assinatura ou cliente ativo com transações reais encontrado para este e-mail no Stripe.');
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey === '' || stripeKey.includes('placeholder')) {
      throw new Error('Chave secreta do Stripe não configurada.');
    }

    const baseOrigin = originURL || process.env.VITE_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseOrigin}/perfil`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => res.json({ 
  status: 'ok', 
  has_sa: hasServiceAccount,
  db_project: DB_PROJECT_ID,
  auth_project: AUTH_PROJECT_ID,
  db_id: DATABASE_ID
}));

if (process.env.NODE_ENV !== 'production') {
  import('vite').then(({ createServer: createViteServer }) => {
    createViteServer({ server: { middlewareMode: true }, appType: 'spa' }).then((vite) => {
      // Handle API 404s before Vite
      app.get('/api/*', (req, res) => {
        res.status(404).json({ error: 'Endpoint da API não encontrado (Dev)' });
      });

      app.use(vite.middlewares);
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    }).catch((err) => {
      console.error('Vite initialization error:', err);
    });
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // Prevent catch-all from serving index.html for API routes
  app.get('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado' });
  });

  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

  if (process.env.VERCEL !== '1' && (process.env.NODE_ENV as string) !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
}

import cron from 'node-cron';

// Cron Job Diário para Notificações MEPP e Cronograma
// Roda às 08:00, 13:00 e 19:00 (Fuso horário de Brasília)
if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  cron.schedule('0 8,13,19 * * *', async () => {
    const now = new Date();
    const hourStr = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: 'numeric' });
    const hour = parseInt(hourStr, 10);
    console.log(`Executando cron job de notificações push (${hour}:00)...`);
    
    let title = '🎯 Hora de Estudar!';
    let body = 'Já conferiu suas metas e revisões pendentes no Stratis Planner hoje?';
    
    if (hour === 8) {
      title = '🌅 Bom dia! Hora de Estudar!';
      body = 'Vamos começar o dia batendo as metas no Stratis Planner!';
    } else if (hour === 13) {
      title = '☀️ Boa tarde! Foco nos Estudos!';
      body = 'Já fez suas revisões hoje? Acesse o Stratis Planner e continue progredindo!';
    } else if (hour === 19) {
      title = '🌙 Boa noite! Último gás do dia!';
      body = 'Ainda dá tempo de revisar matérias e fechar o dia com chave de ouro.';
    }

    const db = getDb();
    let usersSnapshot;
    try {
      console.log(`[Cron] Buscando usuários com notificações ativas...`);
      usersSnapshot = await db.collection('users')
        .where('notificationsEnabled', '==', true)
        .get();
      console.log(`[Cron] Snapshot obtido. Total: ${usersSnapshot.size}`);
    } catch (queryErr: any) {
      console.error('[Cron] Falha Crítica na consulta de usuários:', queryErr.message || queryErr);
      return; // Encerra o job pois não consegue nem listar usuários
    }
        
    const notifications: Promise<any>[] = [];

    // Pega data atual no fuso do Brasil em YYYY-MM-DD
    const tzDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const yyyy = tzDate.getFullYear();
    const mm = String(tzDate.getMonth() + 1).padStart(2, '0');
    const dd = String(tzDate.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;
        
        if (fcmToken) {
          // Verifica se precisa notificar o usuário (se não cumpriu a meta do dia ainda)
          let needsStudyNotification = true;
          
          if (userData.currentContestId) {
            const contestDoc = await db.collection('users').doc(userDoc.id).collection('contests').doc(userData.currentContestId).get();
            if (contestDoc.exists) {
              const contestData = contestDoc.data() || {};
              const hasStudiedToday = contestData.dailyHistory?.some((hist: any) => hist.date === todayStr);
              const pendingRevisions = contestData.meppReviews?.filter((rev: any) => rev.dueDate <= todayStr && !rev.completedAt) || [];
              
              if (hasStudiedToday && pendingRevisions.length === 0) {
                needsStudyNotification = false; 
              }
            }
          }

          if (needsStudyNotification) {
            const message = {
              notification: { title, body },
              token: fcmToken,
              webpush: { notification: { icon: '/logo_pwa.png' } }
            };
            
            notifications.push(
              admin.messaging().send(message)
                .then(() => console.log(`[Cron] Sucesso: ${userDoc.id}`))
                .catch((err) => {
                  if (err.code === 'messaging/registration-token-not-registered') {
                    console.log(`[Cron] Token inválido para ${userDoc.id}, limpando...`);
                    db.collection('users').doc(userDoc.id).update({ fcmToken: null, notificationsEnabled: false }).catch(() => {});
                  } else {
                    console.error(`[Cron] Erro FCM para ${userDoc.id}:`, err.message || err);
                  }
                })
            );
          }
        }
      } catch (userLoopErr: any) {
        console.error(`[Cron] Erro ao processar usuário ${userDoc.id}:`, userLoopErr.message || userLoopErr);
      }
    }
    
    await Promise.allSettled(notifications);
    console.log(`[Cron] Ciclo finalizado.`);
  }, {
    timezone: "America/Sao_Paulo"
  });
}

export default app;

