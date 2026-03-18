/**
 * Firebase configuration for BurmesWeb.
 * Set EXPO_PUBLIC_FIREBASE_* in .env (see FIREBASE_SETUP.md).
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize only if we have the required config (avoids errors before .env is set)
const hasRequiredConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!hasRequiredConfig && typeof window !== "undefined") {
  console.warn(
    "⚠️ Firebase configuration missing! Ensure you have a .env file with:\n" +
    "EXPO_PUBLIC_FIREBASE_API_KEY\n" +
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID\n" +
    "Check FIREBASE_SETUP.md for instructions."
  );
}

const app = hasRequiredConfig ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export default app;
