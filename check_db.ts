import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

try {
  const customConfig = { ...firebaseConfig };
  customConfig.firestoreDatabaseId = 'ai-studio-2c04a0a9-7543-408a-9de2-a5b90862fbad';
  
  const app = initializeApp(customConfig);
  const db = getFirestore(app, customConfig.firestoreDatabaseId);

  console.log('Attempting to read users via CLIENT sdk...');
  const snapshot = await getDocs(query(collection(db, 'users'), limit(1)));
  console.log('Success! Documents:', snapshot.size);
} catch (err) {
  console.error('Error:', err.message || err);
}
