import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

const env = import.meta.env;
export const firebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_AUTH_DOMAIN &&
  env.VITE_FIREBASE_APP_ID,
);

const app = firebaseConfigured
  ? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    })
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
const functions = app ? getFunctions(app, "asia-south1") : null;

if (app && env.VITE_FIREBASE_APPCHECK_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      env.VITE_FIREBASE_APPCHECK_SITE_KEY,
    ),
    isTokenAutoRefreshEnabled: true,
  });
}

const useEmulators =
  env.DEV &&
  (env.VITE_USE_EMULATORS === "true" ||
    env.VITE_USE_FIREBASE_EMULATOR === "true");

if (useEmulators && auth && db && functions) {
  const authUrl = env.VITE_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099";
  const firestoreHost = env.VITE_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
  const firestorePort = Number(env.VITE_FIRESTORE_EMULATOR_PORT || 8080);
  const storageHost = env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1";
  const storagePort = Number(env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || 9199);

  connectAuthEmulator(auth, authUrl, { disableWarnings: true });
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  if (storage) {
    connectStorageEmulator(storage, storageHost, storagePort);
  }
}

export async function callFunction<Input, Output>(
  name: string,
  input: Input,
): Promise<Output> {
  if (!functions) throw new Error("Firebase is not configured.");
  return (await httpsCallable<Input, Output>(functions, name)(input)).data;
}
