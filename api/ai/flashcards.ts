import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAiRequestServerless } from '../../server/utils/aiHandler';
import * as GeminiService from '../../server/services/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { topic, count } = req.body || {};
  await handleAiRequestServerless(req, res, 'flashcardUsage', 'flashcardLimit', () => 
    GeminiService.generateFlashcards(topic, count)
  );
}
