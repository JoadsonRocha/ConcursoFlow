// Firebase Configuration for Server-side (Admin SDK)
// In AI Studio, we use the DATABASE_ID from the provisioned project.

import firebaseConfig from '../../firebase-applet-config.json';

// The project used for Auth verification (must match the client's Firebase config)
export const AUTH_PROJECT_ID = firebaseConfig.projectId;

// Use the project ID from the configuration for the Admin SDK
export const DB_PROJECT_ID = firebaseConfig.projectId;
export const DATABASE_ID = firebaseConfig.firestoreDatabaseId || '';
