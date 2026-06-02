import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Token não fornecido.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Tenta obter o app de autenticação específico 'auth' se existir, ou cai de volta para o app padrão.
    const hasAuthApp = admin.apps.some(app => app?.name === 'auth');
    const authApp = hasAuthApp ? admin.app('auth') : admin.app();
    const decodedToken = await admin.auth(authApp).verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erro na autenticação de token:', error.message || error);
    res.status(401).json({ error: 'Não autorizado. Token inválido.', details: error.message });
  }
};
