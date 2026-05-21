import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp({ projectId: 'test-project-123' });

try {
  const db = getFirestore(admin.app(), 'my-db');
  console.log("Firestore localized initialized successfully!");
} catch (e) {
  console.error("Firestore localized failed to initialize:", e);
}
