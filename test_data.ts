import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, getDocs, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
const app = initializeApp(firebaseConfig);

async function checkDbData(dbId: string) {
  const db = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log(`DB ${dbId} - Users collection size:`, snap.size);
    snap.forEach(d => console.log(`  - user doc: ${d.id}`));
  } catch (e: any) {
    console.error(`DB ${dbId} - Error reading users:`, e.message);
  }
}

async function run() {
  await checkDbData('(default)');
  await checkDbData('ai-studio-ef378564-20e2-44ad-ad66-d81251638619');
  await checkDbData('eduinclusivo');
  process.exit(0);
}
run();
