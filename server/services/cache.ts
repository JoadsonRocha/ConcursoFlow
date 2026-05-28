import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import crypto from 'crypto';
import { DATABASE_ID } from '../constants/config';

// In-memory cache fallback to guard against Firestore permissions or quota issues
const memoryCache = new Map<string, { response: any; createdAt: Date; serviceName: string }>();

function getDb() {
  try {
    const currentDbId = DATABASE_ID || '';
    if (currentDbId && currentDbId !== '(default)' && currentDbId !== '') {
      return getFirestore(admin.app(), currentDbId);
    }
    return getFirestore();
  } catch (e) {
    return null;
  }
}

function generateHash(data: any): string {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function getCachedResponse(serviceName: string, params: any) {
  const hash = generateHash({ serviceName, params });

  // 1. Check in-memory cache first (instant, consumes no Firestore read quotas)
  const memCached = memoryCache.get(hash);
  if (memCached) {
    console.log(`[Cache Hit - Memory] ${serviceName} - ${hash}`);
    return memCached.response;
  }

  // 2. Fall back to Firestore Admin SDK if possible
  const db = getDb();
  if (db) {
    try {
      const cacheRef = db.collection('ai_cache').doc(hash);
      const doc = await cacheRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        console.log(`[Cache Hit - Firestore] ${serviceName} - ${hash}`);
        const response = data?.response;
        if (response) {
          // Populate memory cache so we don't hit database again for this query
          memoryCache.set(hash, { response, createdAt: new Date(), serviceName });
        }
        return response;
      }
    } catch (e: any) {
      if (e?.message?.includes('PERMISSION_DENIED') || e?.code === 7) {
        console.log(`[Cache Info] Firestore cache lookup bypassed (Permission Denied/Unconfigured). using in-memory.`);
      } else {
        console.warn(`[Cache Warning] Failed to get cache from Firestore:`, e?.message || e);
      }
    }
  }
  
  return null;
}

export async function setCachedResponse(serviceName: string, params: any, response: any) {
  const hash = generateHash({ serviceName, params });

  // 1. Save to memory cache immediately
  memoryCache.set(hash, { response, createdAt: new Date(), serviceName });
  console.log(`[Cache Set - Memory] ${serviceName} - ${hash}`);

  // 2. Try persisting to Firestore in high eligibility environments
  const db = getDb();
  if (db) {
    try {
      const cacheRef = db.collection('ai_cache').doc(hash);
      await cacheRef.set({
        serviceName,
        params,
        response,
        createdAt: new Date(),
      });
      console.log(`[Cache Set - Firestore] ${serviceName} - ${hash}`);
    } catch (e: any) {
      if (e?.message?.includes('PERMISSION_DENIED') || e?.code === 7) {
        console.log(`[Cache Info] Firestore cache save bypassed (Permission Denied/Unconfigured). using in-memory.`);
      } else {
        console.warn(`[Cache Warning] Failed to set cache in Firestore:`, e?.message || e);
      }
    }
  }
}
