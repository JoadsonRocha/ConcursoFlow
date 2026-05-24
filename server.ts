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
      adminApp = admin.initializeApp({
        projectId: DB_PROJECT_ID
      });
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

// Mount modular routes
app.use('/api/ai', aiRoutes);

// Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const db = getDb();
    const stripe = getStripe();
    const { priceId: planKey, userId, userEmail } = req.body;
    let stripePriceId = planKey;
    if (planKey === 'monthly_plan') stripePriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    else if (planKey === 'annual_plan') stripePriceId = process.env.STRIPE_ANNUAL_PRICE_ID;

    if (!stripePriceId) {
      throw new Error('ID do plano não configurado.');
    }

    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      const currentPlan = userDoc.data()?.userPlan;
      if (userDoc.exists && (currentPlan === 'pro' || currentPlan === 'annual' || currentPlan === 'monthly')) {
          if (currentPlan === 'pro' || currentPlan === 'annual') throw new Error('Você já possui uma assinatura Premium Anual ativa.');
          if (currentPlan === 'monthly' && planKey === 'monthly_plan') throw new Error('Você já possui uma assinatura mensal ativa.');
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/perfil?success=true`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/planos?canceled=true`,
      metadata: { userId, planType: planKey === 'annual_plan' ? 'annual' : 'monthly' },
    });

    res.json({ id: session.id, url: session.url });
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

