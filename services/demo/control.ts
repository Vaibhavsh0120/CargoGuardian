import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type { AppUser } from "@/types/user";

export type DemoWeightWarningState = -1 | 0 | 1;

const DEMO_CONTROL_COLLECTION = "systemStatus";
const DEMO_CONTROL_DOC_ID = "demoSimulator";

export async function setDemoWeightWarningState(state: DemoWeightWarningState, user: AppUser) {
  const db = getFirebaseAdminDb();

  await db.collection(DEMO_CONTROL_COLLECTION).doc(DEMO_CONTROL_DOC_ID).set(
    {
      weightWarningState: state,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: {
        uid: user.uid,
        role: user.role,
        email: user.email ?? null
      }
    },
    { merge: true }
  );
}

export async function getDemoWeightWarningState(): Promise<DemoWeightWarningState | null> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(DEMO_CONTROL_COLLECTION).doc(DEMO_CONTROL_DOC_ID).get();

  if (!snapshot.exists) {
    return null;
  }

  const value = snapshot.data()?.weightWarningState;
  return value === -1 || value === 0 || value === 1 ? value : null;
}
