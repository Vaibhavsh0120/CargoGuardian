import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { normalizeJourneyStage } from "@/services/trains/access";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type { JourneyStage, TrainStatus, WeightStatus } from "@/types/train";

type WeightWarningState = -1 | 0 | 1;

type BlynkWebhookPayload = {
  deviceId: string;
  weightKg?: number;
  gpsLat?: number;
  gpsLng?: number;
  speedKmh?: number;
  clearanceLed?: boolean | number;
  errorLed?: boolean | number;
  weightWarningState?: number | string | null;
  weightWarningLightColor?: string | null;
  rfidLastScan?: string;
  rfidLastTag?: string;
  trainPower?: boolean | number;
  signalStrength?: number;
};

function normalizeBooleanFlag(value: boolean | number | undefined, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return defaultValue;
}

function normalizeWeightWarningState(payload: BlynkWebhookPayload): WeightWarningState {
  if (payload.weightWarningState === -1 || payload.weightWarningState === 0 || payload.weightWarningState === 1) {
    return payload.weightWarningState;
  }

  if (typeof payload.weightWarningState === "string") {
    const parsed = Number(payload.weightWarningState);
    if (parsed === -1 || parsed === 0 || parsed === 1) {
      return parsed;
    }
  }

  if (payload.weightWarningLightColor === "orange") {
    return -1;
  }

  if (payload.weightWarningLightColor === "red") {
    return 1;
  }

  return normalizeBooleanFlag(payload.errorLed) ? 1 : 0;
}

function weightWarningStateToLabel(weightWarningState: WeightWarningState) {
  if (weightWarningState === -1) {
    return "underweight";
  }

  if (weightWarningState === 1) {
    return "overweight";
  }

  return "safe";
}

function deriveWeightStatus(weightKg: number | null, weightWarningState: WeightWarningState): WeightStatus {
  if (weightWarningState === 1) {
    return "overweight";
  }

  if (weightWarningState === -1) {
    return "underweight";
  }

  return weightKg === null ? "unknown" : "safe";
}

function deriveTrainStatus(
  trainPower: boolean,
  weightWarningState: WeightWarningState,
  speedKmh: number | null
): TrainStatus {
  if (!trainPower) {
    return "offline";
  }

  if (weightWarningState === 1) {
    return "critical";
  }

  if (weightWarningState === -1) {
    return "warning";
  }

  return speedKmh && speedKmh > 0 ? "active" : "idle";
}

function deriveJourneyStage(existingJourneyStage: unknown, trainPower: boolean): JourneyStage {
  if (!trainPower) {
    return "offline";
  }

  const currentJourneyStage = normalizeJourneyStage(existingJourneyStage);
  return currentJourneyStage === "offline" ? "inspection" : currentJourneyStage;
}

export async function ingestTelemetryFromBlynk(payload: BlynkWebhookPayload): Promise<void> {
  const db = getFirebaseAdminDb();
  const normalizedCode = payload.deviceId.toUpperCase();
  const trainSnapshot = await db.collection("trains").where("code", "==", normalizedCode).limit(1).get();

  if (trainSnapshot.empty) {
    throw new Error(`Train with code "${payload.deviceId}" not found.`);
  }

  const trainDoc = trainSnapshot.docs[0];
  const trainId = trainDoc.id;
  const trainData = trainDoc.data() as Record<string, unknown>;
  const now = FieldValue.serverTimestamp();

  const clearanceLed = normalizeBooleanFlag(payload.clearanceLed);
  const trainPower = normalizeBooleanFlag(payload.trainPower, true);
  const speedKmh = typeof payload.speedKmh === "number" ? payload.speedKmh : null;
  const weightKg = typeof payload.weightKg === "number" ? payload.weightKg : null;
  const weightWarningState = normalizeWeightWarningState(payload);
  const weightStatus = deriveWeightStatus(weightKg, weightWarningState);

  const telemetryRecord = {
    trainId,
    weightKg,
    gpsLat: payload.gpsLat ?? (process.env.DEFAULT_GPS_LAT ? parseFloat(process.env.DEFAULT_GPS_LAT) : null),
    gpsLng: payload.gpsLng ?? (process.env.DEFAULT_GPS_LNG ? parseFloat(process.env.DEFAULT_GPS_LNG) : null),
    speedKmh,
    clearanceLed,
    weightWarningState,
    weightWarningLabel: weightWarningStateToLabel(weightWarningState),
    errorLed: weightWarningState === 1,
    rfidLastScan: payload.rfidLastScan ?? null,
    rfidLastTag: payload.rfidLastTag ?? null,
    trainPower,
    signalStrength: typeof payload.signalStrength === "number" ? payload.signalStrength : null,
    createdAt: now
  };

  await db.collection("telemetry_current").doc(trainId).set(telemetryRecord, { merge: true });
  await db.collection("telemetry_history").add(telemetryRecord);

  await db.collection("trains").doc(trainId).update({
    lastSeen: now,
    status: deriveTrainStatus(trainPower, weightWarningState, speedKmh),
    journeyStage: deriveJourneyStage(trainData.journeyStage, trainPower),
    weightStatus,
    updatedAt: now
  });
}

export function buildBlynkWebhookPayload(
  deviceId: string,
  telemetry: {
    weightKg: number;
    gpsLat: number;
    gpsLng: number;
    speedKmh?: number;
    clearanceLed: boolean | number;
    errorLed?: boolean | number;
    weightWarningState?: WeightWarningState;
    weightWarningLightColor?: "off" | "orange" | "red";
    rfidLastScan?: string;
    rfidLastTag?: string;
    trainPower?: boolean | number;
    signalStrength?: number;
  }
): BlynkWebhookPayload {
  return {
    deviceId,
    weightKg: telemetry.weightKg,
    gpsLat: telemetry.gpsLat,
    gpsLng: telemetry.gpsLng,
    speedKmh: telemetry.speedKmh,
    clearanceLed: telemetry.clearanceLed,
    errorLed: telemetry.errorLed,
    weightWarningState: telemetry.weightWarningState,
    weightWarningLightColor: telemetry.weightWarningLightColor,
    rfidLastScan: telemetry.rfidLastScan,
    rfidLastTag: telemetry.rfidLastTag,
    trainPower: telemetry.trainPower,
    signalStrength: telemetry.signalStrength
  };
}
