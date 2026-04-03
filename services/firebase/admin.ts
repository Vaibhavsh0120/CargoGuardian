import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";

import { getServerEnv } from "@/lib/env/server";

let firebaseAdminApp: App | null = null;

export function getFirebaseAdminApp() {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const env = getServerEnv();

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase admin environment variables are not fully configured.");
  }

  firebaseAdminApp = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY
        })
      });

  return firebaseAdminApp;
}
