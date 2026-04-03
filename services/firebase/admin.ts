import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { getServerEnv } from "@/lib/env/server";

let firebaseAdminApp: App | null = null;

export function hasFirebaseAdminCredentials() {
  const env = getServerEnv();
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

export function getFirebaseAdminApp() {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const env = getServerEnv();

  if (!env.FIREBASE_PROJECT_ID) {
    throw new Error("FIREBASE_PROJECT_ID must be configured.");
  }

  firebaseAdminApp = getApps().length
    ? getApp()
    : hasFirebaseAdminCredentials()
      ? initializeApp({
          credential: cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL!,
            privateKey: env.FIREBASE_PRIVATE_KEY!
          })
        })
      : initializeApp({
          projectId: env.FIREBASE_PROJECT_ID
        });

  return firebaseAdminApp;
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
