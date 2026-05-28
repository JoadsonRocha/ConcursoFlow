import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import crypto from 'crypto';
import { DATABASE_ID } from '../constants/config';

function getDb() {
  try {
    const currentDbId = DATABASE_ID || '';
    if (currentDbId && currentDbId !== '(default)' && currentDbId !== '') {
      return getFirestore(admin.app(), currentDbId);
    }
    return getFirestore();
  } catch (e) {
    return getFirestore();
  }
}

function generateHash(data: any): string {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function getCachedResponse(serviceName: string, params: any) {
  const db = getDb();
  const hash = generateHash({ serviceName, params });
  
  try {
    const cacheRef = db.collection('ai_cache').doc(hash);
    const doc = await cacheRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      // Check for expiration (e.g., 7 days) if needed, otherwise return
      console.log(`[Cache Hit] ${serviceName} - ${hash}`);
      return data?.response;
    }
  } catch (e) {
    console.warn(`[Cache Error] Failed to get cache for ${serviceName}:`, e);
  }
  
  return null;
}

export async function setCachedResponse(serviceName: string, params: any, response: any) {
  const db = getDb();
  const hash = generateHash({ serviceName, params });
  
  try {
    const cacheRef = db.collection('ai_cache').doc(hash);
    await cacheRef.set({
      serviceName,
      params,
      response,
      createdAt: new Date(),
    });
    console.log(`[Cache Set] ${serviceName} - ${hash}`);
  } catch (e) {
    console.warn(`[Cache Error] Failed to set cache for ${serviceName}:`, e);
  }
}
