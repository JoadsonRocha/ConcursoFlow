import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { initFirebase, getDb } from '../server/utils/aiHandler';
import { DATABASE_ID, DB_PROJECT_ID, AUTH_PROJECT_ID } from '../server/constants/config';
import { getAiClient } from '../server/services/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'not set',
      PORT: process.env.PORT || 'not set',
    },
    gemini: {
       has_key: !!process.env.GEMINI_API_KEY,
       key_prefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + '...' : 'none'
    },
    stripe: {
       has_secret_key: !!process.env.STRIPE_SECRET_KEY,
       has_webhook_secret: !!process.env.STRIPE_WEBHOOK_SECRET,
       monthly_price_id: process.env.STRIPE_MONTHLY_PRICE_ID ? 'configured' : 'missing',
       annual_price_id: process.env.STRIPE_ANNUAL_PRICE_ID ? 'configured' : 'missing',
    },
    firebase_env: {
      db_project_id: DB_PROJECT_ID,
      auth_project_id: AUTH_PROJECT_ID,
      database_id: DATABASE_ID,
      has_service_account_env: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    }
  };

  // Diagnostic steps
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson);
        diagnostics.firebase_env.service_account_json_parsed = true;
        diagnostics.firebase_env.service_account_project_id = parsed.project_id;
        diagnostics.firebase_env.service_account_client_email = parsed.client_email;
      } catch (jsonErr: any) {
        diagnostics.firebase_env.service_account_json_parsed = false;
        diagnostics.firebase_env.service_account_json_parse_error = jsonErr.message;
      }
    } else {
      diagnostics.firebase_env.service_account_json_parsed = false;
      diagnostics.firebase_env.reason = "FIREBASE_SERVICE_ACCOUNT_JSON variable is missing";
    }
  } catch (err: any) {
    diagnostics.firebase_env.sa_eval_error = err.message;
  }

  // Test Firebase initialization
  try {
    initFirebase();
    diagnostics.firebase_init = {
      status: "success",
      apps_active: admin.apps.map(app => app.name || '[default]'),
    };
  } catch (err: any) {
    diagnostics.firebase_init = {
      status: "error",
      error: err.message,
    };
  }

  // Test Firestore DB localization
  try {
    const db = getDb();
    diagnostics.firestore = {
      status: "initialized",
      database_id_retrieved: db.databaseId || DATABASE_ID,
    };
  } catch (err: any) {
    diagnostics.firestore = {
      status: "error",
      error: err.message,
    };
  }

  // Test Gemini simple initialization (without querying to avoid billing)
  try {
    const client = getAiClient();
    diagnostics.gemini.status = "client_initialized";
  } catch (err: any) {
    diagnostics.gemini.status = "error";
    diagnostics.gemini.error = err.message;
  }

  res.status(200).json({ status: "ok", diagnostics });
}
