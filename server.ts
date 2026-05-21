import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
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
const PORT = process.env.PORT || 3000;

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return new Stripe(key || 'sk_test_placeholder');
};

const getDb = () => {
  try {
    const currentDbId = DATABASE_ID;
    if (currentDbId && currentDbId !== '(default)' && currentDbId !== '') {
      console.log(`[Firestore Admin] Usando banco de dados específico: ${currentDbId}`);
      return getFirestore(admin.app(), currentDbId);
    }
    console.log('[Firestore Admin] Usando banco de dados (default)');
    return getFirestore();
  } catch (e) {
    console.warn(`⚠️ Firestore Admin: Falha ao obter banco específico, tentando fallback...`, e);
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

app.use(express.json());

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
  createViteServer({ server: { middlewareMode: true }, appType: 'spa' }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error('Vite initialization error:', err);
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

  if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;

