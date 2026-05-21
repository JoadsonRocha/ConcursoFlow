import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAiRequestServerless } from '../../server/utils/aiHandler';
import * as GeminiService from '../../server/services/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { title, prompt, quantity } = req.body || {};
  await handleAiRequestServerless(req, res, 'mindmapUsage', 'mindmapLimit', () => 
    GeminiService.generateSVGMap(title, prompt, quantity)
  );
}
