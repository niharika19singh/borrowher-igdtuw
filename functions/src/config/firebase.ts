import * as admin from 'firebase-admin';

/**
 * Standard deployment region for BorrowHer Cloud Functions (2nd Gen).
 * Selected to match client integration co-located in India (Mumbai).
 */
export const FUNCTIONS_REGION = 'asia-south1';

if (admin.apps.length === 0) {
  // If running in Cloud Functions runtime or locally with emulators,
  // initializeApp() automatically picks up environment settings.
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export { admin };
