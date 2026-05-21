import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getDb } from '../server/utils/aiHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const db = getDb();
    const { priceId: planKey, userId, userEmail } = req.body || {};
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
}
