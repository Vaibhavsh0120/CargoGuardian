import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type { AppUser } from "@/types/user";

export type DemoWeightWarningState = -1 | 0 | 1;
export type DemoRuntimeStatus = "stopped" | "running";

export type PersistedDemoSimulationState = {
  weightKg: number;
  gpsLat: number;
  gpsLng: number;
  speedKmh: number;
  clearanceLed: boolean;
  weightWarningState: DemoWeightWarningState;
  rfidLastScan: string | null;
  rfidLastTag: string | null;
  trainPower: boolean;
  signalStrength: number;
  moving: boolean;
  routeProgress: number;
  lastRfidScanAt: number;
  routeIndex: number;
};

export type DemoControlState = {
  runtimeStatus: DemoRuntimeStatus;
  weightWarningState: DemoWeightWarningState;
  simulationState: PersistedDemoSimulationState | null;
  updatedAt: string | null;
  lastTickAt: string | null;
};

const DEMO_CONTROL_COLLECTION = "systemStatus";
const DEMO_CONTROL_DOC_ID = "demoSimulator";

function getIsoString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}

function normalizeWeightWarningState(value: unknown): DemoWeightWarningState {
  return value === -1 || value === 0 || value === 1 ? value : 0;
}

function normalizeRuntimeStatus(value: unknown): DemoRuntimeStatus {
  return value === "running" ? "running" : "stopped";
}

function normalizeSimulationState(value: unknown): PersistedDemoSimulationState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const state = value as Record<string, unknown>;

  return {
    weightKg: typeof state.weightKg === "number" ? state.weightKg : 12500,
    gpsLat: typeof state.gpsLat === "number" ? state.gpsLat : 32.794,
    gpsLng: typeof state.gpsLng === "number" ? state.gpsLng : 34.9896,
    speedKmh: typeof state.speedKmh === "number" ? state.speedKmh : 82,
    clearanceLed: state.clearanceLed === true || state.clearanceLed === 1,
    weightWarningState: normalizeWeightWarningState(state.weightWarningState),
    rfidLastScan: typeof state.rfidLastScan === "string" ? state.rfidLastScan : null,
    rfidLastTag: typeof state.rfidLastTag === "string" ? state.rfidLastTag : null,
    trainPower: state.trainPower === false || state.trainPower === 0 ? false : true,
    signalStrength: typeof state.signalStrength === "number" ? state.signalStrength : -61,
    moving: state.moving === false ? false : true,
    routeProgress: typeof state.routeProgress === "number" ? state.routeProgress : 34,
    lastRfidScanAt: typeof state.lastRfidScanAt === "number" ? state.lastRfidScanAt : 0,
    routeIndex: typeof state.routeIndex === "number" ? state.routeIndex : 1
  };
}

export async function getDemoControlState(): Promise<DemoControlState> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection(DEMO_CONTROL_COLLECTION).doc(DEMO_CONTROL_DOC_ID).get();

  if (!snapshot.exists) {
    return {
      runtimeStatus: "stopped",
      weightWarningState: 0,
      simulationState: null,
      updatedAt: null,
      lastTickAt: null
    };
  }

  const data = snapshot.data() as Record<string, unknown>;

  return {
    runtimeStatus: normalizeRuntimeStatus(data.runtimeStatus),
    weightWarningState: normalizeWeightWarningState(data.weightWarningState),
    simulationState: normalizeSimulationState(data.simulationState),
    updatedAt: getIsoString(data.updatedAt),
    lastTickAt: getIsoString(data.lastTickAt)
  };
}

export async function startDemoSimulation(user: AppUser) {
  const db = getFirebaseAdminDb();

  await db.collection(DEMO_CONTROL_COLLECTION).doc(DEMO_CONTROL_DOC_ID).set(
    {
      runtimeStatus: "running",
      weightWarningState: 0,
      simulationState: null,
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

export async function stopDemoSimulation(user: AppUser) {
  const db = getFirebaseAdminDb();

  await db.collection(DEMO_CONTROL_COLLECTION).doc(DEMO_CONTROL_DOC_ID).set(
    {
      runtimeStatus: "stopped",
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

export async function saveDemoSimulationState(
  simulationState: PersistedDemoSimulationState,
  user: AppUser,
  runtimeStatus: DemoRuntimeStatus
) {
  const db = getFirebaseAdminDb();

  await db.collection(DEMO_CONTROL_COLLECTION).doc(DEMO_CONTROL_DOC_ID).set(
    {
      runtimeStatus,
      simulationState,
      lastTickAt: FieldValue.serverTimestamp(),
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
