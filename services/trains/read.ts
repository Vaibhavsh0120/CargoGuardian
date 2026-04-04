import "server-only";

import { logger } from "@/lib/logger";
import type { TrainListQuery } from "@/lib/validation/trains";
import {
  canWorkerViewTrain,
  listActiveAssignedTrainIds,
  normalizeClearanceStatus,
  normalizeJourneyStage,
  normalizeWeightStatus
} from "@/services/trains/access";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type { AppUser } from "@/types/user";
import type {
  Train,
  TrainListItem,
  TrainStatus,
  TrainSummary,
  CargoType,
  TrainSelectorItem,
  TrainSelectorResponse
} from "@/types/train";

// ── Raw Firestore record ─────────────────────────────────────────────

type RawTrainRecord = Record<string, unknown>;

// ── Normalization helpers ────────────────────────────────────────────

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  return null;
}

function getOptionalIsoString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function getRequiredIsoString(value: unknown): string {
  return getOptionalIsoString(value) ?? new Date().toISOString();
}

function normalizeTrainStatus(value: unknown): TrainStatus {
  return value === "active" || value === "idle" || value === "warning" || value === "critical" || value === "offline"
    ? value
    : "idle";
}

function normalizeCargoType(value: unknown): CargoType {
  const valid: CargoType[] = [
    "general",
    "bulk",
    "liquid",
    "refrigerated",
    "hazardous",
    "container",
    "automotive",
    "livestock",
    "intermodal",
    "other"
  ];
  return valid.includes(value as CargoType) ? (value as CargoType) : "general";
}

function mapTrain(id: string, raw: RawTrainRecord): Train {
  const code = getString(raw.code) ?? getString(raw.trainCode) ?? id.toUpperCase();
  const label = getString(raw.label) ?? getString(raw.displayLabel) ?? getString(raw.name) ?? code;
  const blynkAuthToken = getString(raw.blynkAuthToken);
  const blynkDeviceId = getString(raw.blynkDeviceId);
  const inferredBlynkProvisioningStatus =
    raw.blynkProvisioningStatus === "failed" || !blynkAuthToken ? "failed" : "provisioned";

  return {
    id,
    code,
    label,
    status: normalizeTrainStatus(raw.status),
    clearanceStatus: normalizeClearanceStatus(raw.clearanceStatus),
    clearanceGrantedAt: getOptionalIsoString(raw.clearanceGrantedAt),
    clearanceGrantedBy: getString(raw.clearanceGrantedBy),
    clearanceMethod: raw.clearanceMethod === "remote" || raw.clearanceMethod === "rfid" ? raw.clearanceMethod : null,
    journeyStage: normalizeJourneyStage(raw.journeyStage),
    weightStatus: normalizeWeightStatus(raw.weightStatus),
    cargoType: normalizeCargoType(raw.cargoType),
    carCount: getNumber(raw.carCount) ?? 0,
    maxSpeed: getNumber(raw.maxSpeed),
    origin: getString(raw.origin),
    destination: getString(raw.destination),
    routeId: getString(raw.routeId),
    routeName: getString(raw.routeName) ?? getString((raw.route as Record<string, unknown> | undefined)?.name),
    description: getString(raw.description),
    ownerId: getString(raw.ownerId) ?? "unknown",
    blynkProvisioningStatus: inferredBlynkProvisioningStatus,
    blynkProvisioningError: getString(raw.blynkProvisioningError),
    blynkTemplateId: getString(raw.blynkTemplateId),
    blynkTemplateName: getString(raw.blynkTemplateName),
    blynkAuthToken,
    blynkDeviceId,
    firmware: getString(raw.firmware),
    lastSeen: getOptionalIsoString(raw.lastSeen),
    createdAt: getRequiredIsoString(raw.createdAt),
    updatedAt: getRequiredIsoString(raw.updatedAt ?? raw.lastUpdatedAt)
  };
}

function trainToListItem(train: Train): TrainListItem {
  return {
    id: train.id,
    code: train.code,
    label: train.label,
    status: train.status,
    clearanceStatus: train.clearanceStatus,
    journeyStage: train.journeyStage,
    weightStatus: train.weightStatus,
    cargoType: train.cargoType,
    carCount: train.carCount,
    origin: train.origin,
    destination: train.destination,
    routeName: train.routeName,
    lastSeen: train.lastSeen,
    updatedAt: train.updatedAt
  };
}

function trainToSelectorItem(train: Train): TrainSelectorItem {
  return {
    id: train.id,
    code: train.code,
    label: train.label,
    status: train.status,
    routeName: train.routeName,
    lastUpdatedAt: train.updatedAt
  };
}

function applySearchFilter(items: TrainListItem[], search: string): TrainListItem[] {
  const q = search.toLowerCase();
  return items.filter(
    (t) =>
      t.label.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.origin?.toLowerCase().includes(q) ?? false) ||
      (t.destination?.toLowerCase().includes(q) ?? false) ||
      (t.routeName?.toLowerCase().includes(q) ?? false)
  );
}

// ── List trains ──────────────────────────────────────────────────────

export async function listTrains(query: TrainListQuery, user?: AppUser): Promise<TrainListItem[]> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return [];
  }

  try {
    const db = getFirebaseAdminDb();

    // 1. Resolve permitted train IDs if it's a restricted user.
    let allowedTrainIds: string[] | null = null; // null means 'allow all' (admin)
    if (user && user.role !== "admin") {
      allowedTrainIds = await listActiveAssignedTrainIds(db, user.uid);
    }

    let ref = db.collection("trains").orderBy(query.sortBy ?? "label", query.sortDir ?? "asc");

    if (query.status) {
      ref = ref.where("status", "==", query.status);
    }

    ref = ref.limit(query.limit ?? 50);
    const snapshot = await ref.get();
    
    // 2. Fetch and conditionally filter by assignments or ownership
    let trains = snapshot.docs.map((doc) => mapTrain(doc.id, doc.data()));
    if (user && allowedTrainIds !== null) {
      trains = trains.filter(t => t.ownerId === user.uid || allowedTrainIds.includes(t.id));
      if (user.role === "worker") {
        trains = trains.filter((train) => canWorkerViewTrain(train as unknown as RawTrainRecord));
      }
    }

    const items = trains.map(trainToListItem);

    if (query.search) {
      return applySearchFilter(items, query.search);
    }

    return items;
  } catch (error) {
    logger.warn("Failed to list trains.", error);
    return [];
  }
}

// ── Get single train ─────────────────────────────────────────────────

export async function getTrain(trainId: string, user?: AppUser): Promise<Train | null> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  try {
    const db = getFirebaseAdminDb();
    const doc = await db.collection("trains").doc(trainId).get();

    if (!doc.exists) {
      return null;
    }

    const rawTrain = doc.data() as RawTrainRecord;
    
    if (user && user.role !== "admin" && rawTrain.ownerId !== user.uid) {
      const hasAssignment = (await listActiveAssignedTrainIds(db, user.uid)).includes(trainId);
      if (!hasAssignment) {
        return null;
      }

      if (user.role === "worker" && !canWorkerViewTrain(rawTrain)) {
        return null;
      }
    }

    return mapTrain(doc.id, rawTrain);
  } catch (error) {
    logger.warn(`Failed to get train ${trainId}.`, error);
    return null;
  }
}

// ── Train summary ────────────────────────────────────────────────────

export async function getTrainSummary(user?: AppUser): Promise<TrainSummary> {
  const empty: TrainSummary = {
    totalTrains: 0,
    activeTrains: 0,
    idleTrains: 0,
    warningTrains: 0,
    criticalTrains: 0,
    offlineTrains: 0
  };

  if (!process.env.FIREBASE_PROJECT_ID) {
    return empty;
  }

  try {
    const db = getFirebaseAdminDb();

    let allowedTrainIds: string[] | null = null;
    if (user && user.role !== "admin") {
      allowedTrainIds = await listActiveAssignedTrainIds(db, user.uid);
    }

    const snapshot = await db.collection("trains").select("status", "ownerId").get();
    let trains = snapshot.docs.map((doc) => ({
      id: doc.id,
      status: normalizeTrainStatus(doc.data().status),
      ownerId: doc.data().ownerId as string | null
    }));

    if (user && allowedTrainIds !== null) {
      trains = trains.filter(t => t.ownerId === user.uid || allowedTrainIds.includes(t.id));
      if (user.role === "worker") {
        const trainsSnapshot = await db.collection("trains").select("clearanceStatus", "journeyStage").get();
        const workerVisibilityMap = new Map(
          trainsSnapshot.docs.map((doc) => [doc.id, canWorkerViewTrain(doc.data() as RawTrainRecord)])
        );
        trains = trains.filter((train) => workerVisibilityMap.get(train.id) ?? true);
      }
    }

    return {
      totalTrains: trains.length,
      activeTrains: trains.filter((t) => t.status === "active").length,
      idleTrains: trains.filter((t) => t.status === "idle").length,
      warningTrains: trains.filter((t) => t.status === "warning").length,
      criticalTrains: trains.filter((t) => t.status === "critical").length,
      offlineTrains: trains.filter((t) => t.status === "offline").length
    };
  } catch (error) {
    logger.warn("Failed to compute train summary.", error);
    return empty;
  }
}

// ── Train selector (replaces old train-selector.ts) ──────────────────

export async function listTrainSelectorItems(user?: AppUser): Promise<TrainSelectorResponse> {
  const fetchedAt = new Date().toISOString();

  if (!process.env.FIREBASE_PROJECT_ID) {
    return { trains: [], source: "empty", fetchedAt };
  }

  try {
    const db = getFirebaseAdminDb();
    
    // 1. Resolve permitted train IDs
    let allowedTrainIds: string[] | null = null;
    if (user && user.role !== "admin") {
      allowedTrainIds = await listActiveAssignedTrainIds(db, user.uid);
    }

    const snapshot = await db.collection("trains").limit(50).get();
    let trainsRaw = snapshot.docs.map((doc) => mapTrain(doc.id, doc.data()));
    
    if (user && allowedTrainIds !== null) {
      trainsRaw = trainsRaw.filter(t => t.ownerId === user.uid || allowedTrainIds.includes(t.id));
      if (user.role === "worker") {
        trainsRaw = trainsRaw.filter((train) => canWorkerViewTrain(train as unknown as RawTrainRecord));
      }
    }
    
    const trains = trainsRaw
      .map(trainToSelectorItem)
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      trains,
      source: trains.length ? "firestore" : "empty",
      fetchedAt
    };
  } catch (error) {
    logger.warn("Failed to load train selector list.", error);
    return { trains: [], source: "empty", fetchedAt };
  }
}
