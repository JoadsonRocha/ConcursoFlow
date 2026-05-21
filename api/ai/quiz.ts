import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAiRequestServerless } from '../../server/utils/aiHandler';
import * as GeminiService from '../../server/services/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { topic, subject } = req.body || {};
  await handleAiRequestServerless(req, res, 'quizUsage', 'quizLimit', () => 
    GeminiService.generateQuizQuestions(topic, subject)
  );
}
