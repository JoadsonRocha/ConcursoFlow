import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAiRequestServerless } from '../../server/utils/aiHandler';
import * as GeminiService from '../../server/services/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { topic, count } = req.body || {};
    await handleAiRequestServerless(req, res, 'flashcardUsage', 'flashcardLimit', () => 
      GeminiService.generateFlashcards(topic, count)
    );
  } catch (error: any) {
    console.error("Vercel top-level error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
    }
  }
}
