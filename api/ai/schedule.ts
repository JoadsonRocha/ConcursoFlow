import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAiRequestServerless } from '../../server/utils/aiHandler';
import * as GeminiService from '../../server/services/gemini';

export const maxDuration = 60; // Extend Vercel Serverless Function timeout to 60 seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { subjectsSummary, days } = req.body || {};
    await handleAiRequestServerless(req, res, 'importUsage', 'importLimit', () => 
      GeminiService.generateSchedule(subjectsSummary, days)
    );
  } catch (error: any) {
    if (!res.headersSent) res.status(500).json({ error: String(error.message || error) });
  }
}
