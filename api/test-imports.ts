import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  const results: any = {};
  
  try {
    results.import_admin = "loading...";
    const admin = await import('firebase-admin');
    results.import_admin = "success";
  } catch (e: any) {
    results.import_admin = "failed: " + e.message;
  }
  
  try {
    results.import_genai = "loading...";
    const genai = await import('@google/genai');
    results.import_genai = "success";
  } catch (e: any) {
    results.import_genai = "failed: " + e.message;
  }
  
  try {
    results.import_aiHandler_no_ext = "loading...";
    const aiHandler = await import('../server/utils/aiHandler');
    results.import_aiHandler_no_ext = "success";
  } catch (e: any) {
    results.import_aiHandler_no_ext = "failed: " + e.message;
  }

  try {
    results.import_aiHandler_ts = "loading...";
    // @ts-ignore
    const aiHandler = await import('../server/utils/aiHandler.ts');
    results.import_aiHandler_ts = "success";
  } catch (e: any) {
    results.import_aiHandler_ts = "failed: " + e.message;
  }

  res.status(200).json(results);
}
