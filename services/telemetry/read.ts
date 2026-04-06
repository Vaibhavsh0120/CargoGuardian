import "server-only";

import { logger } from "@/lib/logger";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { applyBlynkConnectionToFreshness, getBlynkConnectionOverrides } from "@/services/telemetry/live-status";
import { listAccessibleTrains, getTrain } from "@/services/trains/read";
import {
  deriveDisplayJourneyStage,
  deriveMovementState,
  deriveSpeedFromTelemetryPoints,
  deriveTelemetryFreshness,
  deriveTelemetryTrainStatus,
  deriveWeightStatus,
  getBoolean,
  getNumber,
  getOptionalIsoString,
  getString,
  normalizeWeightWarningState,
  weightWarningStateToLabel
} from "@/services/telemetry/derive";
import type {
  TelemetryCurrentListResponse,
  TelemetryHistoryPoint,
  TelemetryHistoryResponse,
  TelemetrySnapshot
} from "@/types/telemetry";
import type { Train, WeightStatus } from "@/types/train";
import type { AppUser } from "@/types/user";

type RawTelemetryRecord = {
  id: string;
  trainId: string;
  weightKg: number | null;
  gpsLat: number | null;
  gpsLng: number | null;
  reportedSpeedKmh: number | null;
  derivedSpeedKmh: number | null;
  clearanceLed: boolean;
  weightWarningState: -1 | 0 | 1;
  rfidLastScan: string | null;
  rfidLastTag: string | null;
  signalStrength: number | null;
  createdAt: string | null;
};

type RawRecord = Record<string, unknown>;

type FirestoreLikeError = {
  code?: unknown;
  details?: unknown;
};

function mapTelemetryRecord(id: string, raw: RawRecord): RawTelemetryRecord {
  return {
    id,
    trainId: getString(raw.trainId) ?? id,
    weightKg: getNumber(raw.weightKg),
    gpsLat: getNumber(raw.gpsLat),
    gpsLng: getNumber(raw.gpsLng),
    reportedSpeedKmh: getNumber(raw.reportedSpeedKmh) ?? getNumber(raw.speedKmh),
    derivedSpeedKmh: getNumber(raw.derivedSpeedKmh),
    clearanceLed: getBoolean(raw.clearanceLed),
    weightWarningState: normalizeWeightWarningState(
      raw.weightWarningState,
      raw.weightWarningLightColor,
      raw.errorLed
    ),
    rfidLastScan: getString(raw.rfidLastScan),
    rfidLastTag: getString(raw.rfidLastTag),
    signalStrength: getNumber(raw.signalStrength),
    createdAt: getOptionalIsoString(raw.createdAt)
  };
}

function inferWarningStateFromWeightStatus(weightStatus: WeightStatus): -1 | 0 | 1 {
  if (weightStatus === "underweight") {
    return -1;
  }

  if (weightStatus === "overweight") {
    return 1;
  }

  return 0;
}

function resolveSpeed(current: RawTelemetryRecord, previous: RawTelemetryRecord | null) {
  return (
    current.derivedSpeedKmh ??
    deriveSpeedFromTelemetryPoints(
      {
        gpsLat: current.gpsLat,
        gpsLng: current.gpsLng,
        recordedAt: current.createdAt
      },
      previous
        ? {
            gpsLat: previous.gpsLat,
            gpsLng: previous.gpsLng,
            recordedAt: previous.createdAt
          }
        : null
    ) ??
    current.reportedSpeedKmh
  );
}

function buildTelemetrySnapshot(
  train: Train,
  current: RawTelemetryRecord | null,
  previous: RawTelemetryRecord | null = null,
  blynkConnected: boolean | null = null
): TelemetrySnapshot {
  const reportedAt = current?.createdAt ?? train.lastSeen;
  const freshness = applyBlynkConnectionToFreshness(deriveTelemetryFreshness(reportedAt), blynkConnected);
  const weightWarningState = current?.weightWarningState ?? inferWarningStateFromWeightStatus(train.weightStatus);
  const weightStatus = current ? deriveWeightStatus(current.weightKg, weightWarningState) : train.weightStatus;
  const speedKmh = current ? resolveSpeed(current, previous) : null;

  return {
    trainId: train.id,
    trainCode: train.code,
    trainLabel: train.label,
    status: deriveTelemetryTrainStatus({
      freshnessState: freshness.state,
      weightWarningState,
      speedKmh
    }),
    journeyStage: train.journeyStage,
    displayJourneyStage: deriveDisplayJourneyStage(train.journeyStage, freshness.state),
    weightStatus,
    displayWeightStatus: weightStatus,
    hasTelemetry: Boolean(current),
    weightKg: current?.weightKg ?? null,
    gpsLat: current?.gpsLat ?? null,
    gpsLng: current?.gpsLng ?? null,
    speedKmh,
    movementState: deriveMovementState(speedKmh),
    clearanceLed: current?.clearanceLed ?? false,
    weightWarningState,
    weightWarningLabel: weightWarningStateToLabel(weightWarningState),
    rfidLastScan: current?.rfidLastScan ?? null,
    rfidLastTag: current?.rfidLastTag ?? null,
    signalStrength: current?.signalStrength ?? null,
    reportedAt,
    ageSeconds: freshness.ageSeconds,
    freshnessState: freshness.state,
    isStale: freshness.isStale,
    isOffline: freshness.isOffline
  };
}

function buildTelemetryHistoryPoints(records: RawTelemetryRecord[]): TelemetryHistoryPoint[] {
  return records.map((record, index) => {
    const previous = index > 0 ? records[index - 1] : null;
    const speedKmh = resolveSpeed(record, previous);

    return {
      id: record.id,
      trainId: record.trainId,
      recordedAt: record.createdAt ?? new Date().toISOString(),
      weightKg: record.weightKg,
      gpsLat: record.gpsLat,
      gpsLng: record.gpsLng,
      speedKmh,
      movementState: deriveMovementState(speedKmh),
      clearanceLed: record.clearanceLed,
      weightWarningState: record.weightWarningState,
      signalStrength: record.signalStrength
    };
  });
}

function summarizeSnapshots(snapshots: TelemetrySnapshot[]): TelemetryCurrentListResponse["summary"] {
  return {
    totalTrains: snapshots.length,
    reportingTrains: snapshots.filter((snapshot) => snapshot.hasTelemetry).length,
    freshTrains: snapshots.filter((snapshot) => snapshot.freshnessState === "fresh").length,
    staleTrains: snapshots.filter((snapshot) => snapshot.freshnessState === "stale").length,
    offlineTrains: snapshots.filter((snapshot) => snapshot.freshnessState === "offline").length,
    movingTrains: snapshots.filter((snapshot) => snapshot.movementState === "moving").length
  };
}

function compareSnapshotPriority(left: TelemetrySnapshot, right: TelemetrySnapshot) {
  const statusRank: Record<TelemetrySnapshot["status"], number> = {
    critical: 0,
    warning: 1,
    active: 2,
    idle: 3,
    offline: 4
  };

  const freshnessRank: Record<TelemetrySnapshot["freshnessState"], number> = {
    fresh: 0,
    stale: 1,
    offline: 2
  };

  const statusDelta = statusRank[left.status] - statusRank[right.status];
  if (statusDelta !== 0) {
    return statusDelta;
  }

  const freshnessDelta = freshnessRank[left.freshnessState] - freshnessRank[right.freshnessState];
  if (freshnessDelta !== 0) {
    return freshnessDelta;
  }

  const leftTime = left.reportedAt ? new Date(left.reportedAt).getTime() : 0;
  const rightTime = right.reportedAt ? new Date(right.reportedAt).getTime() : 0;

  return rightTime - leftTime;
}

function isMissingFirestoreIndexError(error: unknown) {
  const candidate = error as FirestoreLikeError | null;
  return candidate?.code === 9 && typeof candidate.details === "string" && candidate.details.includes("requires an index");
}

function sortRecordsByCreatedAtDesc(records: RawTelemetryRecord[]) {
  return [...records].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

async function queryTelemetryHistoryRecords(trainId: string, limit: number): Promise<RawTelemetryRecord[]> {
  const db = getFirebaseAdminDb();

  try {
    const historySnapshot = await db
      .collection("telemetry_history")
      .where("trainId", "==", trainId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return historySnapshot.docs.map((doc) => mapTelemetryRecord(doc.id, doc.data() as RawRecord));
  } catch (error) {
    if (!isMissingFirestoreIndexError(error)) {
      throw error;
    }

    // Firestore index not yet created - falling back to client-side sorting.
    // This is gracefully handled and does not impact functionality.
    const fallbackSnapshot = await db.collection("telemetry_history").where("trainId", "==", trainId).get();
    const records = fallbackSnapshot.docs.map((doc) => mapTelemetryRecord(doc.id, doc.data() as RawRecord));
    return sortRecordsByCreatedAtDesc(records).slice(0, limit);
  }
}

async function getPreviousHistoryPoint(trainId: string, current: RawTelemetryRecord): Promise<RawTelemetryRecord | null> {
  const records = await queryTelemetryHistoryRecords(trainId, 3);

  return (
    records.find(
      (record) =>
        record.id !== current.id &&
        (record.createdAt !== current.createdAt ||
          record.gpsLat !== current.gpsLat ||
          record.gpsLng !== current.gpsLng ||
          record.weightKg !== current.weightKg)
    ) ?? null
  );
}

export async function listCurrentTelemetry(limit: number, user?: AppUser): Promise<TelemetryCurrentListResponse> {
  const fetchedAt = new Date().toISOString();

  if (!process.env.FIREBASE_PROJECT_ID) {
    return {
      summary: {
        totalTrains: 0,
        reportingTrains: 0,
        freshTrains: 0,
        staleTrains: 0,
        offlineTrains: 0,
        movingTrains: 0
      },
      snapshots: [],
      fetchedAt
    };
  }

  try {
    const db = getFirebaseAdminDb();
    const trains = await listAccessibleTrains(
      {
        limit: 50,
        sortBy: "updatedAt",
        sortDir: "desc"
      },
      user
    );

    if (!trains.length) {
      return {
        summary: {
          totalTrains: 0,
          reportingTrains: 0,
          freshTrains: 0,
          staleTrains: 0,
          offlineTrains: 0,
          movingTrains: 0
        },
        snapshots: [],
        fetchedAt
      };
    }

    const docs = await db.getAll(...trains.map((train) => db.collection("telemetry_current").doc(train.id)));
    const telemetryByTrainId = new Map<string, RawTelemetryRecord>();

    docs.forEach((doc) => {
      if (!doc.exists) {
        return;
      }

      telemetryByTrainId.set(doc.id, mapTelemetryRecord(doc.id, doc.data() as RawRecord));
    });

    const connectionOverrides = await getBlynkConnectionOverrides(trains);
    const snapshots = trains
      .map((train) =>
        buildTelemetrySnapshot(
          train,
          telemetryByTrainId.get(train.id) ?? null,
          null,
          connectionOverrides.get(train.id) ?? null
        )
      )
      .sort(compareSnapshotPriority);

    return {
      summary: summarizeSnapshots(snapshots),
      snapshots: snapshots.slice(0, limit),
      fetchedAt
    };
  } catch (error) {
    logger.warn("Failed to list current telemetry.", error);
    return {
      summary: {
        totalTrains: 0,
        reportingTrains: 0,
        freshTrains: 0,
        staleTrains: 0,
        offlineTrains: 0,
        movingTrains: 0
      },
      snapshots: [],
      fetchedAt
    };
  }
}

export async function getCurrentTelemetry(trainId: string, user?: AppUser): Promise<TelemetrySnapshot | null> {
  const train = await getTrain(trainId, user);
  if (!train) {
    return null;
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    return buildTelemetrySnapshot(train, null);
  }

  try {
    const db = getFirebaseAdminDb();
    const currentDoc = await db.collection("telemetry_current").doc(trainId).get();
    const connectionOverrides = await getBlynkConnectionOverrides([train]);
    const blynkConnected = connectionOverrides.get(train.id) ?? null;

    if (!currentDoc.exists) {
      return buildTelemetrySnapshot(train, null, null, blynkConnected);
    }

    const current = mapTelemetryRecord(currentDoc.id, currentDoc.data() as RawRecord);
    const previous = await getPreviousHistoryPoint(trainId, current);

    return buildTelemetrySnapshot(train, current, previous, blynkConnected);
  } catch (error) {
    logger.warn(`Failed to load current telemetry for train ${trainId}.`, error);
    return buildTelemetrySnapshot(train, null);
  }
}

export async function getTelemetryHistory(
  trainId: string,
  limit: number,
  user?: AppUser
): Promise<TelemetryHistoryResponse | null> {
  const train = await getTrain(trainId, user);
  if (!train) {
    return null;
  }

  const fetchedAt = new Date().toISOString();

  if (!process.env.FIREBASE_PROJECT_ID) {
    return {
      trainId,
      history: [],
      fetchedAt
    };
  }

  try {
    const records = (await queryTelemetryHistoryRecords(trainId, limit))
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return leftTime - rightTime;
      });

    return {
      trainId,
      history: buildTelemetryHistoryPoints(records),
      fetchedAt
    };
  } catch (error) {
    logger.warn(`Failed to load telemetry history for train ${trainId}.`, error);
    return {
      trainId,
      history: [],
      fetchedAt
    };
  }
}
