import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp({ projectId: 'test-project-123' });

async function run() {
  try {
    const db = getFirestore();
    console.log("Firestore initialized successfully!");
    console.log("Trying to read...");
    await db.collection('users').doc('123').get();
    console.log("Read completed");
  } catch (e) {
    console.error("Firestore failed:", e);
  }
}
run();
