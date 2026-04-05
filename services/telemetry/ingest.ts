import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { normalizeJourneyStage } from "@/services/trains/access";
import {
  deriveMovementState,
  deriveSpeedFromTelemetryPoints,
  deriveTelemetryTrainStatus,
  deriveWeightStatus,
  getNumber,
  getOptionalIsoString,
  getBoolean,
  normalizeWeightWarningState,
  weightWarningStateToLabel
} from "@/services/telemetry/derive";
import { getFirebaseAdminDb } from "@/services/firebase/admin";

type WeightWarningState = -1 | 0 | 1;

type BlynkWebhookPayload = {
  deviceId: string;
  weightKg?: number | string | null;
  gpsLat?: number | string | null;
  gpsLng?: number | string | null;
  speedKmh?: number | string | null;
  clearanceLed?: boolean | number | string | null;
  errorLed?: boolean | number | string | null;
  weightWarningState?: number | string | null;
  weightWarningLightColor?: string | null;
  rfidLastScan?: string | null;
  rfidLastTag?: string | null;
  trainPower?: boolean | number | string | null;
  signalStrength?: number | string | null;
};

type RawTelemetryRecord = Record<string, unknown>;

function mapPreviousTelemetry(raw: RawTelemetryRecord | undefined) {
  if (!raw) {
    return null;
  }

  return {
    gpsLat: getNumber(raw.gpsLat),
    gpsLng: getNumber(raw.gpsLng),
    recordedAt: getOptionalIsoString(raw.createdAt)
  };
}

function deriveJourneyStage(existingJourneyStage: unknown) {
  const currentJourneyStage = normalizeJourneyStage(existingJourneyStage);
  return currentJourneyStage === "offline" ? "inspection" : currentJourneyStage;
}

export class TelemetryTrainNotFoundError extends Error {
  constructor(code: string) {
    super(`Train with code "${code}" not found.`);
    this.name = "TelemetryTrainNotFoundError";
  }
}

export async function ingestTelemetryFromBlynk(payload: BlynkWebhookPayload): Promise<void> {
  const db = getFirebaseAdminDb();
  const normalizedCode = payload.deviceId.toUpperCase();
  const trainSnapshot = await db.collection("trains").where("code", "==", normalizedCode).limit(1).get();

  if (trainSnapshot.empty) {
    throw new TelemetryTrainNotFoundError(payload.deviceId);
  }

  const trainDoc = trainSnapshot.docs[0];
  const trainId = trainDoc.id;
  const trainData = trainDoc.data() as Record<string, unknown>;
  const now = FieldValue.serverTimestamp();
  const receivedAtIso = new Date().toISOString();

  const previousCurrentDoc = await db.collection("telemetry_current").doc(trainId).get();
  const previousCurrent = previousCurrentDoc.exists
    ? mapPreviousTelemetry(previousCurrentDoc.data() as RawTelemetryRecord)
    : null;

  const clearanceLed = getBoolean(payload.clearanceLed);
  const reportedSpeedKmh = getNumber(payload.speedKmh);
  const weightKg = getNumber(payload.weightKg);
  const weightWarningState = normalizeWeightWarningState(
    payload.weightWarningState,
    payload.weightWarningLightColor,
    payload.errorLed
  );
  const weightStatus = deriveWeightStatus(weightKg, weightWarningState);
  const gpsLat = getNumber(payload.gpsLat) ?? (process.env.DEFAULT_GPS_LAT ? parseFloat(process.env.DEFAULT_GPS_LAT) : null);
  const gpsLng = getNumber(payload.gpsLng) ?? (process.env.DEFAULT_GPS_LNG ? parseFloat(process.env.DEFAULT_GPS_LNG) : null);
  const derivedSpeedKmh =
    deriveSpeedFromTelemetryPoints(
      {
        gpsLat,
        gpsLng,
        recordedAt: receivedAtIso
      },
      previousCurrent
    ) ?? reportedSpeedKmh;
  const movementState = deriveMovementState(derivedSpeedKmh);

  const telemetryRecord = {
    trainId,
    weightKg,
    gpsLat,
    gpsLng,
    speedKmh: reportedSpeedKmh,
    reportedSpeedKmh,
    derivedSpeedKmh,
    movementState,
    clearanceLed,
    weightWarningState,
    weightWarningLabel: weightWarningStateToLabel(weightWarningState),
    errorLed: weightWarningState === 1,
    rfidLastScan: payload.rfidLastScan ?? null,
    rfidLastTag: payload.rfidLastTag ?? null,
    trainPower: getBoolean(payload.trainPower, true),
    signalStrength: getNumber(payload.signalStrength),
    createdAt: now
  };

  await db.collection("telemetry_current").doc(trainId).set(telemetryRecord, { merge: true });
  await db.collection("telemetry_history").add(telemetryRecord);

  await db.collection("trains").doc(trainId).update({
    lastSeen: now,
    status: deriveTelemetryTrainStatus({
      freshnessState: "fresh",
      weightWarningState,
      speedKmh: derivedSpeedKmh
    }),
    journeyStage: deriveJourneyStage(trainData.journeyStage),
    weightStatus,
    updatedAt: now
  });
}

export function buildBlynkWebhookPayload(
  deviceId: string,
  telemetry: {
    weightKg?: number | string | null;
    gpsLat?: number | string | null;
    gpsLng?: number | string | null;
    speedKmh?: number | string | null;
    clearanceLed: boolean | number | string | null;
    errorLed?: boolean | number | string | null;
    weightWarningState?: WeightWarningState | string | null;
    weightWarningLightColor?: "off" | "orange" | "red";
    rfidLastScan?: string | null;
    rfidLastTag?: string | null;
    trainPower?: boolean | number | string | null;
    signalStrength?: number | string | null;
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
