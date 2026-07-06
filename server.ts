import dotenv from 'dotenv';
// Carrega o dotenv imediatamente no início absoluto do arquivo para garantir que as constantes locais importadas depois vejam as variáveis de ambiente corretas.
dotenv.config();

import { setGlobalDispatcher, Agent } from 'undici';

// Configura o dispatcher global do fetch para evitar HeadersTimeoutError em chamadas lentas da IA
const globalAgent = new Agent({
  headersTimeout: 300000, // 5 minutos
  bodyTimeout: 300000,    // 5 minutos
  connectTimeout: 60000,  // 1 minuto
});
setGlobalDispatcher(globalAgent);

import express from 'express';
import path from 'path';
import cors from 'cors';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import aiRoutes from './server/routes/ai';
import { authenticate } from './server/middleware/auth';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

import { DATABASE_ID, DB_PROJECT_ID, AUTH_PROJECT_ID } from './server/constants/config';

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

let selectedEnvVarName = '';
let serviceAccountJson = '';

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  selectedEnvVarName = 'FIREBASE_SERVICE_ACCOUNT_JSON';
  serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  selectedEnvVarName = 'FIREBASE_SERVICE_ACCOUNT';
  serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
} else if (process.env.JSON_ACCOUNT) {
  selectedEnvVarName = 'JSON_ACCOUNT';
  serviceAccountJson = process.env.JSON_ACCOUNT;
} else if (process.env.JSON_ACOUNT) {
  selectedEnvVarName = 'JSON_ACOUNT';
  serviceAccountJson = process.env.JSON_ACOUNT;
} else if (process.env.json_account) {
  selectedEnvVarName = 'json_account';
  serviceAccountJson = process.env.json_account;
} else if (process.env.json_acount) {
  selectedEnvVarName = 'json_acount';
  serviceAccountJson = process.env.json_acount;
} else if (process.env.SERVICE_ACCOUNT_JSON) {
  selectedEnvVarName = 'SERVICE_ACCOUNT_JSON';
  serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
} else if (process.env.SERVICE_ACCOUNT) {
  selectedEnvVarName = 'SERVICE_ACCOUNT';
  serviceAccountJson = process.env.SERVICE_ACCOUNT;
}

if (!serviceAccountJson && fs.existsSync(path.join(process.cwd(), 'service_account.json'))) {
  selectedEnvVarName = 'local file (service_account.json)';
  serviceAccountJson = fs.readFileSync(path.join(process.cwd(), 'service_account.json'), 'utf8');
}

// Limpeza e decodificação robusta do JSON de Service Account para evitar falhas de deploy (ex: Railway)
if (serviceAccountJson) {
  let cleaned = serviceAccountJson.trim();
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.startsWith('ey')) {
    try {
      cleaned = Buffer.from(cleaned, 'base64').toString('utf8').trim();
    } catch (b64Err: any) {
      console.error('⚠️ [Firebase Admin] Falha ao decodificar Base64:', b64Err.message);
    }
  }
  // Corrige caracteres de nova linha escapados comuns em variáveis de ambiente
  cleaned = cleaned.replace(/\\n/g, '\n');
  serviceAccountJson = cleaned;
}

const hasServiceAccount = serviceAccountJson && !serviceAccountJson.includes('...');

// Executa diagnósticos imediatos impressos de forma ultra limpa para auxiliar o usuário na Railway
if (serviceAccountJson) {
  const len = serviceAccountJson.length;
  const startsWithCurly = serviceAccountJson.startsWith('{');
  const endsWithCurly = serviceAccountJson.endsWith('}');
  const isProbablyRawPem = serviceAccountJson.includes('-----BEGIN PRIVATE KEY-----') && !startsWithCurly;
  let isValidJson = false;
  let jsonParseError = '';

  try {
    JSON.parse(serviceAccountJson);
    isValidJson = true;
  } catch (parseErr: any) {
    jsonParseError = parseErr.message || String(parseErr);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔎 [Firebase Diagnóstico] Carregada variável: "${selectedEnvVarName}"`);
  console.log(`   - Comprimento da string: ${len} caracteres`);
  console.log(`   - Começa com '{'? ${startsWithCurly ? 'SIM ✅' : 'NÃO ❌'}`);
  console.log(`   - Termina com '}'? ${endsWithCurly ? 'SIM ✅' : 'NÃO ❌'}`);
  console.log(`   - É um PEM bruto diretamente (Chave Privada colada como JSON)? ${isProbablyRawPem ? 'SIM ⚠️ (DEVE ser o JSON completo, não apenas a chave!)' : 'NÃO ✅'}`);
  console.log(`   - É um JSON sintaticamente válido? ${isValidJson ? 'SIM ✅' : 'NÃO ❌'}`);
  if (!isValidJson && jsonParseError) {
    console.log(`   - Detalhe do erro de sintaxe JSON: "${jsonParseError}"`);
    console.log(`   - Amostra do conteúdo inicial: "${serviceAccountJson.substring(0, 100)}..."`);
    console.log(`   - Amostra do conteúdo final: "...${serviceAccountJson.substring(Math.max(0, len - 100))}"`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} else {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️ [Firebase Diagnóstico] Nenhuma credencial de Service Account (JSON_ACOUNT, etc.) foi encontrada!');
  console.log('   O sistema utilizará fallback local para validação temporária.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

function getFirebaseCredential(projectId: string) {
  if (hasServiceAccount) {
    try {
      const sa = JSON.parse(serviceAccountJson as string);
      return admin.credential.cert(sa);
    } catch (e: any) {
      console.error('❌ Erro ao processar serviceAccountJson diretamente:', e.message || e);
      try {
        let raw = serviceAccountJson as string;
        raw = raw.replace(/\\"/g, '"').replace(/\\n/g, '\n');
        const sa = JSON.parse(raw);
        return admin.credential.cert(sa);
      } catch (e2: any) {
        console.error('❌ Falha total ao decodificar JSON do Service Account:', e2.message || e2);
      }
    }
  }
  
  try {
    return admin.credential.applicationDefault();
  } catch (credErr: any) {
    console.warn(`⚠️ [Firebase] Não foi possível carregar as credenciais padrão para o projeto ${projectId}. Usando fallback de certificado dummy para validação de tokens.`);
    const dummyPrivateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3r7v7t7v7t7v7\n-----END PRIVATE KEY-----\n";
    return admin.credential.cert({
      projectId: projectId,
      clientEmail: `dummy@${projectId}.iam.gserviceaccount.com`,
      privateKey: dummyPrivateKey
    });
  }
}

// Primary Admin App (for Firestore permissions)
const hasDefaultApp = admin.apps.some(app => app?.name === '[DEFAULT]');
if (!hasDefaultApp) {
  try {
    const credential = getFirebaseCredential(DB_PROJECT_ID);
    adminApp = admin.initializeApp({
      credential,
      projectId: DB_PROJECT_ID
    });
    console.log('✅ Firebase Admin: Inicializado com projeto:', DB_PROJECT_ID);
  } catch (err: any) {
    console.error('❌ Firebase Admin: Erro crítico na inicialização do app principal:', err.message || err);
  }
} else {
  adminApp = admin.app();
  console.log('✅ Firebase Admin: Default app já estava inicializado.');
}

// Auth-specific App (to avoid audience mismatch if environment project != auth project)
try {
  const hasAuthApp = admin.apps.some(app => app?.name === 'auth');
  if (!hasAuthApp) {
    const finalAuthProjectId = AUTH_PROJECT_ID;
    const credential = getFirebaseCredential(finalAuthProjectId);
    authApp = admin.initializeApp({
      credential,
      projectId: finalAuthProjectId
    }, 'auth');
    console.log('✅ Firebase Auth App: Inicializado para o projeto:', finalAuthProjectId);
  } else {
    authApp = admin.app('auth');
    console.log('✅ Firebase Auth App: Já inicializado anteriormente.');
  }
} catch (err: any) {
  console.warn('⚠️ Firebase Auth App: Erro ou já inicializado:', err.message || err);
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Set trust proxy first so that middlewares like rate limiter can trust headers
app.set('trust proxy', 1);

// Basic Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: false, // Disabling frameguard to allow embedding in AI Studio iFrames
  hsts: false // Disable HSTS to prevent iframe HTTPS issues in development/dev proxies
}));

// Rate Limiting to prevent brute-force and bot spam - ONLY on API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs
  message: { error: 'Muitas requisições deste IP. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false } // Disable trust proxy warning
});
app.use('/api', limiter);

// Prevent HTTP Parameter Pollution
app.use(hpp());

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
          // Attempt case-insensitive match options due to Firestore query limits
          let snapshot = await db.collection('users').where('email', '==', customerEmail).limit(1).get();
          if (snapshot.empty) {
            snapshot = await db.collection('users').where('email', '==', customerEmail.toLowerCase()).limit(1).get();
          }
          if (snapshot.empty) {
            snapshot = await db.collection('users').where('email', '==', customerEmail.toUpperCase()).limit(1).get();
          }
          if (snapshot.empty) {
            // Check formatted capitalized case for domain (e.g. joadsonrochaRR@gmail.com)
            const parts = customerEmail.split('@');
            if (parts.length === 2) {
              const formattedEmail = parts[0].substring(0, parts[0].length - 2) + "RR@" + parts[1];
              snapshot = await db.collection('users').where('email', '==', formattedEmail).limit(1).get();
            }
          }
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
app.post('/api/notify', authenticate, async (req: any, res) => {
  const { userId, title, body, icon } = req.body;
  const requesterUid = req.user?.uid;
  const requesterEmail = req.user?.email || '';
  
  // Apenas admins ou o próprio usuário podem enviar notificações
  const isSpecialEmail = ['onrocha08@gmail.com', 'joadsonrocharr@gmail.com', 'joadsonrochar@gmail.com'].includes(requesterEmail.toLowerCase().trim());
  if (!isSpecialEmail && userId !== requesterUid) {
    return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para disparar notificações para este usuário.' });
  }

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

app.post('/api/send-email', authenticate, async (req: any, res) => {
  const { to, subject, html, text, from } = req.body;
  if (!to || !subject) return res.status(400).json({ error: 'Faltam campos obrigatórios para envio de email' });
  
  const requesterEmail = req.user?.email || '';
  const isSpecialEmail = ['onrocha08@gmail.com', 'joadsonrocharr@gmail.com', 'joadsonrochar@gmail.com'].includes(requesterEmail.toLowerCase().trim());
  
  if (!isSpecialEmail) {
    // Se não for admin, o destinatário ("to") tem que ser igual ao e-mail autenticado do usuário
    const recipientEmails = Array.isArray(to) ? to : [to];
    const hasOtherRecipients = recipientEmails.some(email => email.toLowerCase().trim() !== requesterEmail.toLowerCase().trim());
    if (hasOtherRecipients) {
      return res.status(403).json({ error: 'Acesso negado. Usuários não administradores só podem enviar e-mails para si mesmos.' });
    }
  }

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
app.post('/api/create-checkout-session', authenticate, async (req: any, res) => {
  try {
    const db = getDb();
    const { priceId: planKey } = req.body;
    const userId = req.user?.uid;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ error: 'Não autorizado. Identificação do usuário não encontrada no token.' });
    }

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
app.post('/api/create-portal-session', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    const { originURL } = req.body;

    if (!userId || !userEmail) {
      return res.status(401).json({ error: 'Não autorizado. Identificação do usuário não encontrada no token.' });
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

// Sincronização e auto-recuperação de assinaturas com Stripe
app.post('/api/auth/sync-subscription', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ error: 'Não autorizado. Identificação do usuário não encontrada no token.' });
    }

    const db = getDb();
    const stripe = getStripe();
    let hasActiveSubscription = false;
    let activePlan = 'free';
    let stripeCustomerId = '';

    // Sincronizar pelo e-mail original, minúsculo e maiúsculo
    const emailVariations = [
      userEmail.trim(),
      userEmail.toLowerCase().trim(),
      userEmail.toUpperCase().trim()
    ];

    // Adiciona caso de variação "RR"
    const parts = userEmail.split('@');
    if (parts.length === 2 && parts[0].toLowerCase().endsWith('rr')) {
      emailVariations.push(parts[0].substring(0, parts[0].length - 2) + "RR@" + parts[1]);
    }

    // Remover duplicatas
    const uniqueEmails = Array.from(new Set(emailVariations));

    // Buscar no Stripe por clientes
    for (const email of uniqueEmails) {
      const customers = await stripe.customers.list({
        email: email,
        limit: 5
      });

      for (const customer of customers.data) {
        stripeCustomerId = customer.id;
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 10
        });

        if (subscriptions.data.length > 0) {
          hasActiveSubscription = true;
          const sub = subscriptions.data[0];
          // Determinar se é anual ou mensal
          const isAnnual = sub.items.data.some(
            item => item.price.id.includes('annual') || item.price.id === process.env.STRIPE_ANNUAL_PRICE_ID
          );
          activePlan = isAnnual ? 'annual' : 'monthly';
          break;
        }
      }
      if (hasActiveSubscription) break;
    }

    if (hasActiveSubscription && userId) {
      // Atualiza o banco com plano Pro
      await db.collection('users').doc(userId).update({
        userPlan: activePlan,
        stripeCustomerId: stripeCustomerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.json({ success: true, plan: activePlan, stripeCustomerId });
    }

    // Se o email for um dos e-mails especiais, auto-concede "pro"
    const isSpecialEmail = uniqueEmails.some(e => 
      ['onrocha08@gmail.com', 'joadsonrocharr@gmail.com', 'joadsonrochar@gmail.com'].includes(e.toLowerCase())
    );

    if (isSpecialEmail && userId) {
      await db.collection('users').doc(userId).update({
        userPlan: 'annual',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.json({ success: true, plan: 'annual', isSpecial: true });
    }

    return res.json({ 
      success: false, 
      error: 'Nenhuma assinatura ativa encontrada no Stripe para este e-mail. Caso tenha efetuado o pagamento recente, certifique-se de que o e-mail de pagamento corresponde ao e-mail logado no aplicativo.' 
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar assinatura:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor ao sincronizar assinatura.' });
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

