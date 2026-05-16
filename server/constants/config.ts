// Firebase Configuration for Server-side (Admin SDK)
// In AI Studio, we use the DATABASE_ID from the provisioned project.

import firebaseConfig from '../../firebase-applet-config.json';

export const DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';
