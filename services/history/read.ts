import "server-only";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { listAccessibleTrains } from "@/services/trains/read";
import { getOptionalIsoString, getString } from "@/services/telemetry/derive";
import type { EventCategory, HistoryListResponse, OperationalEvent } from "@/types/event";
import type { AppUser, UserRole } from "@/types/user";

type RawRecord = Record<string, unknown>;

type HistoryQuery = {
  trainId?: string;
  category?: EventCategory | "all";
  limit?: number;
};

function normalizeEventCategory(value: unknown): EventCategory {
  return value === "alert" || value === "clearance" || value === "telemetry" ? value : "access";
}

function normalizeEventSeverity(value: unknown): OperationalEvent["severity"] {
  return value === "warning" || value === "critical" ? value : "info";
}

function normalizeRole(value: unknown): UserRole | null {
  return value === "admin" || value === "master" || value === "worker" || value === "not-set" ? value : null;
}

function mapEvent(id: string, raw: RawRecord): OperationalEvent {
  return {
    id,
    category: normalizeEventCategory(raw.category),
    action: getString(raw.action) ?? "event",
    severity: normalizeEventSeverity(raw.severity),
    title: getString(raw.title) ?? "Operational event",
    description: getString(raw.description) ?? "Operational activity recorded.",
    trainId: getString(raw.trainId),
    trainCode: getString(raw.trainCode),
    trainLabel: getString(raw.trainLabel),
    actorId: getString(raw.actorId),
    actorLabel: getString(raw.actorLabel),
    actorRole: normalizeRole(raw.actorRole),
    createdAt: getOptionalIsoString(raw.createdAt) ?? new Date().toISOString(),
    metadata: (raw.metadata as OperationalEvent["metadata"] | undefined) ?? {}
  };
}

function sortEventsByCreatedAtDesc(left: OperationalEvent, right: OperationalEvent) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

export async function listOperationalEvents(query: HistoryQuery, user?: AppUser): Promise<HistoryListResponse> {
  const fetchedAt = new Date().toISOString();

  if (!process.env.FIREBASE_PROJECT_ID) {
    return {
      events: [],
      fetchedAt
    };
  }

  const accessibleTrains = await listAccessibleTrains(
    {
      limit: 100,
      sortBy: "updatedAt",
      sortDir: "desc"
    },
    user
  );
  const accessibleTrainIds = new Set(accessibleTrains.map((train) => train.id));
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("events").get();
  const events = snapshot.docs
    .map((doc) => mapEvent(doc.id, doc.data() as RawRecord))
    .filter((event) => (event.trainId ? accessibleTrainIds.has(event.trainId) : true))
    .filter((event) => (query.trainId ? event.trainId === query.trainId : true))
    .filter((event) => (query.category && query.category !== "all" ? event.category === query.category : true))
    .sort(sortEventsByCreatedAtDesc);

  return {
    events: events.slice(0, query.limit ?? 100),
    fetchedAt
  };
}
