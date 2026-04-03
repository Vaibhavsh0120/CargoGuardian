import "server-only";

import { getClientEnv } from "@/lib/env/client";
import { logger } from "@/lib/logger";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type {
  TrainSelectorItem,
  TrainSelectorResponse,
  TrainStatus
} from "@/types/train";

const DEMO_TRAINS: TrainSelectorItem[] = [
  {
    id: "demo-atlantic-freight-12",
    code: "CG-1208",
    label: "Atlantic Freight 12",
    status: "active",
    routeName: "Savannah to Memphis",
    lastUpdatedAt: null
  },
  {
    id: "demo-cascade-mineral-4",
    code: "CG-2084",
    label: "Cascade Mineral 4",
    status: "warning",
    routeName: "Tacoma to Spokane",
    lastUpdatedAt: null
  },
  {
    id: "demo-plains-corridor-9",
    code: "CG-3301",
    label: "Plains Corridor 9",
    status: "offline",
    routeName: "Omaha to Cheyenne",
    lastUpdatedAt: null
  }
];

type RawTrainRecord = {
  code?: unknown;
  trainCode?: unknown;
  label?: unknown;
  name?: unknown;
  displayLabel?: unknown;
  status?: unknown;
  routeName?: unknown;
  route?: {
    name?: unknown;
  };
  updatedAt?: unknown;
  lastUpdatedAt?: unknown;
};

export async function listTrainSelectorItems(): Promise<TrainSelectorResponse> {
  const fetchedAt = new Date().toISOString();
  const demoMode = getClientEnv().NEXT_PUBLIC_DEMO_MODE === "true";

  if (demoMode) {
    return {
      trains: DEMO_TRAINS,
      source: "demo",
      fetchedAt
    };
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    return {
      trains: [],
      source: "empty",
      fetchedAt
    };
  }

  try {
    const snapshot = await getFirebaseAdminDb().collection("trains").limit(25).get();
    const trains = snapshot.docs
      .map((document) => mapTrainSelectorItem(document.id, document.data() as RawTrainRecord))
      .sort((left, right) => left.label.localeCompare(right.label));

    return {
      trains,
      source: trains.length ? "firestore" : "empty",
      fetchedAt
    };
  } catch (error) {
    logger.warn("Failed to load train selector list.", error);

    return {
      trains: [],
      source: "empty",
      fetchedAt
    };
  }
}

function mapTrainSelectorItem(id: string, raw: RawTrainRecord): TrainSelectorItem {
  const code = getString(raw.code) ?? getString(raw.trainCode) ?? id.toUpperCase();
  const label = getString(raw.label) ?? getString(raw.displayLabel) ?? getString(raw.name) ?? code;
  const routeName = getString(raw.routeName) ?? getString(raw.route?.name) ?? null;
  const lastUpdatedAt = getIsoString(raw.lastUpdatedAt ?? raw.updatedAt);

  return {
    id,
    code,
    label,
    status: normalizeTrainStatus(raw.status),
    routeName,
    lastUpdatedAt
  };
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getIsoString(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    const maybeTimestamp = value as { toDate: () => Date };
    return maybeTimestamp.toDate().toISOString();
  }

  return null;
}

function normalizeTrainStatus(value: unknown): TrainStatus {
  return value === "active" ||
    value === "idle" ||
    value === "warning" ||
    value === "critical" ||
    value === "offline"
    ? value
    : "idle";
}
