import "server-only";

import { getClientEnv } from "@/lib/env/client";
import { logger } from "@/lib/logger";
import type { TrainListQuery } from "@/lib/validation/trains";
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

// ── Demo data ────────────────────────────────────────────────────────

const DEMO_TRAINS: Train[] = [
  {
    id: "demo-atlantic-freight-12",
    code: "CG-1208",
    label: "Atlantic Freight 12",
    status: "active",
    cargoType: "container",
    carCount: 42,
    maxSpeed: 120,
    origin: "Savannah",
    destination: "Memphis",
    routeId: null,
    routeName: "Savannah to Memphis",
    description: "Primary east-west container corridor service.",
    ownerId: "demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "demo-cascade-mineral-4",
    code: "CG-2084",
    label: "Cascade Mineral 4",
    status: "warning",
    cargoType: "bulk",
    carCount: 28,
    maxSpeed: 90,
    origin: "Tacoma",
    destination: "Spokane",
    routeId: null,
    routeName: "Tacoma to Spokane",
    description: "Bulk mineral freight via Cascade range.",
    ownerId: "demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "demo-plains-corridor-9",
    code: "CG-3301",
    label: "Plains Corridor 9",
    status: "offline",
    cargoType: "general",
    carCount: 18,
    maxSpeed: 110,
    origin: "Omaha",
    destination: "Cheyenne",
    routeId: null,
    routeName: "Omaha to Cheyenne",
    description: "General freight across the Great Plains.",
    ownerId: "demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "demo-gulf-hazmat-7",
    code: "CG-4417",
    label: "Gulf Hazmat 7",
    status: "critical",
    cargoType: "hazardous",
    carCount: 12,
    maxSpeed: 65,
    origin: "Houston",
    destination: "New Orleans",
    routeId: null,
    routeName: "Houston to New Orleans",
    description: "Hazardous materials transport along Gulf coast.",
    ownerId: "demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "demo-mountain-cold-2",
    code: "CG-5502",
    label: "Mountain Cold 2",
    status: "idle",
    cargoType: "refrigerated",
    carCount: 22,
    maxSpeed: 100,
    origin: "Denver",
    destination: "Salt Lake City",
    routeId: null,
    routeName: "Denver to Salt Lake City",
    description: "Refrigerated goods via Rocky Mountain corridor.",
    ownerId: "demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

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

function getIsoString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
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

  return {
    id,
    code,
    label,
    status: normalizeTrainStatus(raw.status),
    cargoType: normalizeCargoType(raw.cargoType),
    carCount: getNumber(raw.carCount) ?? 0,
    maxSpeed: getNumber(raw.maxSpeed),
    origin: getString(raw.origin),
    destination: getString(raw.destination),
    routeId: getString(raw.routeId),
    routeName: getString(raw.routeName) ?? getString((raw.route as Record<string, unknown> | undefined)?.name),
    description: getString(raw.description),
    ownerId: getString(raw.ownerId) ?? "unknown",
    createdAt: getIsoString(raw.createdAt),
    updatedAt: getIsoString(raw.updatedAt ?? raw.lastUpdatedAt)
  };
}

function trainToListItem(train: Train): TrainListItem {
  return {
    id: train.id,
    code: train.code,
    label: train.label,
    status: train.status,
    cargoType: train.cargoType,
    carCount: train.carCount,
    origin: train.origin,
    destination: train.destination,
    routeName: train.routeName,
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

// ── isDemoMode ───────────────────────────────────────────────────────

function isDemoMode(): boolean {
  return getClientEnv().NEXT_PUBLIC_DEMO_MODE === "true";
}

// ── List trains ──────────────────────────────────────────────────────

export async function listTrains(query: TrainListQuery, user?: AppUser): Promise<TrainListItem[]> {
  if (isDemoMode()) {
    return applyClientFilters(DEMO_TRAINS.map(trainToListItem), query);
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    return [];
  }

  try {
    const db = getFirebaseAdminDb();

    // 1. Resolve permitted train IDs if it's a restricted user.
    let allowedTrainIds: string[] | null = null; // null means 'allow all' (admin)
    if (user && user.role !== "admin") {
      const perms = await db.collection("trainAssignments").where("userId", "==", user.uid).get();
      allowedTrainIds = perms.docs.map(doc => doc.data().trainId as string);
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

function applyClientFilters(items: TrainListItem[], query: TrainListQuery): TrainListItem[] {
  let result = items;

  if (query.status) {
    result = result.filter((t) => t.status === query.status);
  }

  if (query.search) {
    result = applySearchFilter(result, query.search);
  }

  const sortBy = query.sortBy ?? "label";
  const sortDir = query.sortDir === "desc" ? -1 : 1;

  result.sort((a, b) => {
    const aVal = a[sortBy as keyof TrainListItem] ?? "";
    const bVal = b[sortBy as keyof TrainListItem] ?? "";
    return String(aVal).localeCompare(String(bVal)) * sortDir;
  });

  return result.slice(0, query.limit ?? 50);
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

// ── Get single train ─────────────────────────────────────────────────

export async function getTrain(trainId: string, user?: AppUser): Promise<Train | null> {
  if (isDemoMode()) {
    return DEMO_TRAINS.find((t) => t.id === trainId) ?? null;
  }

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
      const perms = await db.collection("trainAssignments")
        .where("trainId", "==", trainId)
        .where("userId", "==", user.uid)
        .get();
        
      if (perms.empty) {
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

  if (isDemoMode()) {
    return computeSummary(DEMO_TRAINS);
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    return empty;
  }

  try {
    const db = getFirebaseAdminDb();

    let allowedTrainIds: string[] | null = null;
    if (user && user.role !== "admin") {
      const perms = await db.collection("trainAssignments").where("userId", "==", user.uid).get();
      allowedTrainIds = perms.docs.map(doc => doc.data().trainId as string);
    }

    const snapshot = await db.collection("trains").select("status", "ownerId").get();
    let trains = snapshot.docs.map((doc) => ({
      id: doc.id,
      status: normalizeTrainStatus(doc.data().status),
      ownerId: doc.data().ownerId as string | null
    }));

    if (user && allowedTrainIds !== null) {
      trains = trains.filter(t => t.ownerId === user.uid || allowedTrainIds.includes(t.id));
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

function computeSummary(trains: Train[]): TrainSummary {
  return {
    totalTrains: trains.length,
    activeTrains: trains.filter((t) => t.status === "active").length,
    idleTrains: trains.filter((t) => t.status === "idle").length,
    warningTrains: trains.filter((t) => t.status === "warning").length,
    criticalTrains: trains.filter((t) => t.status === "critical").length,
    offlineTrains: trains.filter((t) => t.status === "offline").length
  };
}

// ── Train selector (replaces old train-selector.ts) ──────────────────

export async function listTrainSelectorItems(user?: AppUser): Promise<TrainSelectorResponse> {
  const fetchedAt = new Date().toISOString();

  if (isDemoMode()) {
    return {
      trains: DEMO_TRAINS.map(trainToSelectorItem),
      source: "demo",
      fetchedAt
    };
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    return { trains: [], source: "empty", fetchedAt };
  }

  try {
    const db = getFirebaseAdminDb();
    
    // 1. Resolve permitted train IDs
    let allowedTrainIds: string[] | null = null;
    if (user && user.role !== "admin") {
      const perms = await db.collection("trainAssignments").where("userId", "==", user.uid).get();
      allowedTrainIds = perms.docs.map(doc => doc.data().trainId as string);
    }

    const snapshot = await db.collection("trains").limit(50).get();
    let trainsRaw = snapshot.docs.map((doc) => mapTrain(doc.id, doc.data()));
    
    if (user && allowedTrainIds !== null) {
      trainsRaw = trainsRaw.filter(t => t.ownerId === user.uid || allowedTrainIds.includes(t.id));
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
