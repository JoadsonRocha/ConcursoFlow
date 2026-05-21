import { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { PLANS } from '../constants/plans';
import { DATABASE_ID, DB_PROJECT_ID, AUTH_PROJECT_ID } from '../constants/config';
import * as fs from 'fs';
import * as path from 'path';

// Firebase initialization for serverless environments
export function initFirebase() {
  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  try {
    if (!serviceAccountJson && fs.existsSync(path.join(process.cwd(), 'service_account.json'))) {
      serviceAccountJson = fs.readFileSync(path.join(process.cwd(), 'service_account.json'), 'utf8');
    }
  } catch (e) {
    console.warn("Could not read service_account.json", e);
  }
  const hasServiceAccount = serviceAccountJson && !serviceAccountJson.includes('...');

  if (admin.apps.length === 0) {
    try {
      if (hasServiceAccount) {
        try {
          const sa = JSON.parse(serviceAccountJson as string);
          admin.initializeApp({
            credential: admin.credential.cert(sa),
            projectId: sa.project_id
          });
        } catch (parseErr) {
          console.error('Invalid Service Account JSON:', parseErr);
          admin.initializeApp({ projectId: DB_PROJECT_ID });
        }
      } else {
        admin.initializeApp({ projectId: DB_PROJECT_ID });
      }
    } catch (err) {
      console.error('❌ Firebase Admin Utils: Erro na inicialização:', err);
    }
  }

  try {
    const authConfig: admin.AppOptions = { projectId: AUTH_PROJECT_ID };
    if (hasServiceAccount) {
      try {
        const sa = JSON.parse(serviceAccountJson as string);
        authConfig.credential = admin.credential.cert(sa);
      } catch (e) {}
    }
    admin.initializeApp(authConfig, 'auth');
  } catch (err) {
    // Expected to throw if 'auth' app already exists
  }
}

export const getDb = () => {
  initFirebase();
  try {
    const currentDbId = DATABASE_ID || '';
    if (currentDbId && currentDbId !== '(default)' && currentDbId !== '') {
      return getFirestore(admin.app(), currentDbId);
    }
    return getFirestore();
  } catch (e) {
    console.warn("⚠️ AI Route: Falha ao obter Firestore, tentando fallback.", e);
    return getFirestore();
  }
};

export async function authenticateServerless(req: VercelRequest, res: VercelResponse): Promise<admin.auth.DecodedIdToken | null> {
  initFirebase();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autorizado. Token não fornecido.' });
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const authApp = admin.app('auth');
    return await admin.auth(authApp).verifyIdToken(idToken);
  } catch (error: any) {
    console.error('Erro na autenticação de token:', error.message || error);
    res.status(401).json({ error: 'Não autorizado. Token inválido.', details: error.message });
    return null;
  }
}

export async function handleAiRequestServerless(
  req: VercelRequest, 
  res: VercelResponse, 
  usageField: string, 
  limitField: string, 
  action: () => Promise<any>
) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const user = await authenticateServerless(req, res);
  if (!user) return;
  const userId = user.uid;

  let db: any = null;
  try {
    db = getDb();
  } catch (error) {
    console.warn("Could not get db for tracking, skipping tracking:", error);
  }

  if (db) {
    try {
      await db.runTransaction(async (transaction: any) => {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) return; // skip tracking

        const data = userDoc.data();
        const plan = data?.userPlan || 'free'; 
        let usage = data?.[usageField] || 0;
        const limits = PLANS[plan] || PLANS.free;
        const limit = (limits as any)[limitField] || 0;

        const now = new Date();
        const lastReset = data?.lastUsageReset?.toDate ? data.lastUsageReset.toDate() : new Date(0);
        let needsReset = false;
        
        if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
          needsReset = true;
          usage = 0;
        }

        if (usage >= limit) {
          throw new Error(`Limite atingido para o seu plano. Faça upgrade para continuar.`);
        }

        const updateData: any = {
          [usageField]: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp()
        };

        if (needsReset) {
          updateData.summaryUsage = usageField === 'summaryUsage' ? 1 : 0;
          updateData.flashcardUsage = usageField === 'flashcardUsage' ? 1 : 0;
          updateData.mindmapUsage = usageField === 'mindmapUsage' ? 1 : 0;
          updateData.importUsage = usageField === 'importUsage' ? 1 : 0;
          updateData.quizUsage = usageField === 'quizUsage' ? 1 : 0;
          updateData.lastUsageReset = FieldValue.serverTimestamp();
        }

        transaction.update(userRef, updateData);
      });
    } catch (transactionErr: any) {
      if (transactionErr.message?.includes('Limite atingido')) {
        return res.status(403).json({ error: transactionErr.message });
      }
      console.warn(`⚠️ [AI Route] Falha ao registrar uso no DB para ${userId}:`, transactionErr.message || transactionErr);
    }
  }

  try {
    const result = await action();
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`AI Route Error (${usageField}):`, error);
    const errorMsg = String(error.message || '');
    if (error.status === 429 || error.code === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || error.status === 503 || errorMsg.includes('503')) {
      return res.status(error.status || 429).json({ error: "Os limites da inteligência artificial do sistema foram atingidos temporariamente. Por favor, tente novamente daqui a pouco." });
    }
    res.status(400).json({ error: error.message || String(error) });
  }
}
