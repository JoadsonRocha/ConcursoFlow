import { auth } from '../lib/firebase';

export async function createCheckoutSession(priceId: string) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Você precisa estar logado para assinar.');
  }

  // Use price IDs from .env (accessible via import.meta.env if prefixed with VITE_)
  // For the backend, we use the IDs configured there.
  
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const finalUrl = apiUrl ? `${apiUrl}/api/create-checkout-session` : '/api/create-checkout-session';

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId: user.uid,
        userEmail: user.email,
        originURL: window.location.origin,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

export async function createPortalSession() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Você precisa estar logado para gerenciar sua assinatura.');
  }

  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const finalUrl = apiUrl ? `${apiUrl}/api/create-portal-session` : '/api/create-portal-session';

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.uid,
        userEmail: user.email,
        originURL: window.location.origin,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Portal error:', error);
    throw error;
  }
}

