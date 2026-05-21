import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.status(200).json({
    status: 'ok',
    message: 'Basic serverless function works!',
    node_version: process.version,
    env_keys: Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('PASSWORD') && !k.includes('SECRET') && !k.includes('JSON'))
  });
}
