import { Router } from 'express';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PLANS } from '../constants/plans';
import * as GeminiService from '../services/gemini';
import { DATABASE_ID } from '../constants/config';

const router = Router();

// Generic handler for AI usage to stay DRY
async function handleAiRequest(req: AuthRequest, res: any, usageField: string, limitField: string, action: Function) {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: 'ID do usuário não identificado.' });

  const db = getFirestore(DATABASE_ID);

  try {
    // 1. Check limits and increment usage atomically
    const userData = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) throw new Error('Perfil do usuário não encontrado.');

      const data = userDoc.data();
      const plan = 'pro'; // data?.userPlan || 'free';
      const usage = data?.[usageField] || 0;
      const limits = PLANS[plan] || PLANS.free;
      const limit = (limits as any)[limitField];

      if (usage >= limit) {
        throw new Error(`Limite atingido para o seu plano (${plan.toUpperCase()}). Faça upgrade para continuar.`);
      }

      transaction.update(userRef, {
        [usageField]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      });

      return data;
    });

    // 2. Perform AI action
    const result = await action();
    res.json(result);
  } catch (error: any) {
    console.error(`AI Route Error (${usageField}):`, error);
    res.status(error.message.includes('Limite') ? 403 : 400).json({ error: error.message });
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

export default router;
