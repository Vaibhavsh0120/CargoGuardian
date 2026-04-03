import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

import { getClientEnv } from "@/lib/env/client";

let firebaseClientApp: FirebaseApp | null = null;

export function getFirebaseClientApp() {
  if (firebaseClientApp) {
    return firebaseClientApp;
  }

  const env = getClientEnv();

  if (
    !env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    !env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    !env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    !env.NEXT_PUBLIC_FIREBASE_APP_ID
  ) {
    throw new Error("Firebase client environment variables are not fully configured.");
  }

  firebaseClientApp = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
      });

  return firebaseClientApp;
}
