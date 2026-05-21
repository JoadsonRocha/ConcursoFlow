import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAiRequestServerless } from '../../server/utils/aiHandler';
import * as GeminiService from '../../server/services/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { subjectsSummary, days } = req.body || {};
  await handleAiRequestServerless(req, res, 'importUsage', 'importLimit', () => 
    GeminiService.generateSchedule(subjectsSummary, days)
  );
}
