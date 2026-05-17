import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import aiRoutes from './server/routes/ai';

import { DATABASE_ID } from './server/constants/config';

dotenv.config();

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON.includes('...')) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin: Inicializado com sucesso.');
    }
  } catch (err) {
    console.error('❌ Firebase Admin: Erro ao processar o JSON.');
  }
} else if (admin.apps.length === 0) {
  // Try to initialize with default credentials in managed environments
  try {
    admin.initializeApp();
    console.log('✅ Firebase Admin: Inicializado com credenciais padrão.');
  } catch (err) {
    console.warn('⚠️ Firebase Admin: Não foi possível inicializar (sem JSON e sem default).');
  }
}

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    const getStripe = () => {
      const key = process.env.STRIPE_SECRET_KEY;
      return new Stripe(key || 'sk_test_placeholder');
    };
    
    // Lazy-load DB to avoid crash if init failed above
    const getDb = () => {
      try {
        return getFirestore(DATABASE_ID);
      } catch (e) {
        console.error("❌ Erro ao obter Firestore Admin:", e);
        throw e;
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

    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Critical error starting server:', error);
    process.exit(1);
  }
}

startServer();

