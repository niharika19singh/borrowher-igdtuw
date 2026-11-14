import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  // If running in Cloud Functions runtime or locally with emulators,
  // initializeApp() automatically picks up environment settings.
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export { admin };
