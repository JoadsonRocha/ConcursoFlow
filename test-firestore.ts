import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp({ projectId: 'test-project-123' });

try {
  const db = getFirestore();
  console.log("Firestore initialized successfully!");
} catch (e) {
  console.error("Firestore failed to initialize:", e);
}
