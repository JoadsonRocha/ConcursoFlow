import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAiRequestServerless } from '../../server/utils/aiHandler';
import * as GeminiService from '../../server/services/gemini';

export const maxDuration = 60; // Extend Vercel Serverless Function timeout to 60 seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { subject } = req.body || {};
    await handleAiRequestServerless(req, res, 'mindmapUsage', 'mindmapLimit', () => 
      GeminiService.generateMindMap(subject)
    );
  } catch (error: any) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
}
