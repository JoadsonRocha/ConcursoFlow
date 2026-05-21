import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

try {
  const db = getFirestore();
  console.log("Firestore initialized?");
} catch (e) {
  console.error("Firestore failed:", e);
}
