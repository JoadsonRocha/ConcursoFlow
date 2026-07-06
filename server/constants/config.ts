// Firebase Configuration for Server-side (Admin SDK)
// In AI Studio, we use the DATABASE_ID from the provisioned project.

import * as fs from 'fs';
import * as path from 'path';

let projectId = '';
let firestoreDatabaseId = '';

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    projectId = config.projectId || '';
    firestoreDatabaseId = config.firestoreDatabaseId || '';
  }
} catch (e) {
  console.warn('⚠️ Could not load firebase-applet-config.json', e);
}

// Fallbacks
export const AUTH_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || projectId || 'gen-lang-client-0925764429';
export const DB_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || projectId || 'gen-lang-client-0925764429';
export const DATABASE_ID = process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || firestoreDatabaseId || 'ai-studio-ef378564-20e2-44ad-ad66-d81251638619';

