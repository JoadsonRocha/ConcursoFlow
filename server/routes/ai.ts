import { Router } from 'express';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PLANS } from '../constants/plans';
import * as GeminiService from '../services/gemini';
import { DATABASE_ID } from '../constants/config';

const router = Router();

// Generic handler for AI usage to stay DRY
async function handleAiRequest(req: AuthRequest, res: any, usageField: string, limitField: string, action: Function) {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'ID do usuário não identificado.' });

  const getDb = () => {
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
  const db = getDb();

  try {
    const db = getDb();
    
    try {
      // 1. Check limits and increment usage atomically
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) return; // if user not found, just skip tracking

        const data = userDoc.data();
        let plan = data?.userPlan || 'free';
        
        // Hardcoded PRO for special user
        if (data?.email === 'onrocha08@gmail.com') {
          plan = 'pro';
        }

        let usage = data?.[usageField] || 0;
        const limits = PLANS[plan] || PLANS.free;
        const limit = (limits as any)[limitField];

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
      if (transactionErr.message.includes('Limite atingido')) {
        throw transactionErr; // Re-throw limit errors
      }
      console.warn(`⚠️ [AI Route] Falha ao registrar uso no DB para ${userId}:`, transactionErr.message || transactionErr);
    }

    // 2. Perform AI action
    const result = await action();
    res.json(result);
  } catch (error: any) {
    console.error(`AI Route Error (${usageField}):`, error);

    try {
      const errorMsg = String(error?.message || error);
      const statusCode = typeof error?.status === 'number' && error.status >= 100 && error.status <= 599 ? error.status : 500;
      
      if (statusCode === 429 || error?.code === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || statusCode === 503 || errorMsg.includes('503')) {
        return res.status(statusCode === 500 ? 429 : statusCode).json({ error: "Os limites da inteligência artificial do sistema foram atingidos temporariamente. Por favor, tente novamente daqui a pouco." });
      }
      res.status(statusCode === 500 ? 500 : statusCode).json({ error: errorMsg, rawError: String(error) });
    } catch (fallbackError) {
      console.error("Critical fallback route error", fallbackError);
      res.status(500).json({ error: "Internal server crash", details: String(fallbackError) });
    }
  }
}

router.post('/flashcards', authenticate, (req, res) => {
  const { topic, count } = req.body;
  handleAiRequest(req, res, 'flashcardUsage', 'flashcardLimit', () => GeminiService.generateFlashcards(topic, count));
});

router.post('/summary', authenticate, (req, res) => {
  const { text } = req.body;
  handleAiRequest(req, res, 'summaryUsage', 'summaryLimit', () => GeminiService.generateSummary(text));
});

router.post('/mindmap', authenticate, (req, res) => {
  const { subject } = req.body;
  handleAiRequest(req, res, 'mindmapUsage', 'mindmapLimit', () => GeminiService.generateMindMap(subject));
});

router.post('/quiz', authenticate, (req, res) => {
  const { topic, subject } = req.body;
  handleAiRequest(req, res, 'quizUsage', 'quizLimit', () => GeminiService.generateQuizQuestions(topic, subject));
});

router.post('/parse-edital', authenticate, (req, res) => {
  const { rawText } = req.body;
  handleAiRequest(req, res, 'importUsage', 'importLimit', () => GeminiService.parseEdital(rawText));
});

router.post('/schedule', authenticate, (req, res) => {
  const { subjectsSummary, days } = req.body;
  // Use importUsage or a generic one if not specified
  handleAiRequest(req, res, 'importUsage', 'importLimit', () => GeminiService.generateSchedule(subjectsSummary, days));
});

router.post('/svg-map', authenticate, (req, res) => {
  const { title, prompt, quantity } = req.body;
  handleAiRequest(req, res, 'mindmapUsage', 'mindmapLimit', () => GeminiService.generateSVGMap(title, prompt, quantity));
});

router.post('/pareto', authenticate, (req, res) => {
  const { contestRole, banca, subjects, isHighPerformance } = req.body;
  handleAiRequest(req, res, 'importUsage', 'importLimit', () => GeminiService.analyzePareto(contestRole, banca, subjects, isHighPerformance));
});

export default router;
