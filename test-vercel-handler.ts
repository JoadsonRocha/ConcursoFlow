import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './api/ai/flashcards.js';

const req = {
  method: 'POST',
  headers: {},
  body: { topic: 'Direito', count: 2 },
} as any as VercelRequest;

const res = {
  setHeader: () => {},
  status: (code: number) => {
    console.log(`Status: ${code}`);
    return res;
  },
  json: (data: any) => {
    console.log('JSON Output:', typeof data === 'string' ? data.substring(0, 100) : data);
    return res;
  },
  end: () => {}
} as any as VercelResponse;

handler(req, res).then(() => console.log('Done')).catch(e => console.error(e));
