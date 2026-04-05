import "server-only";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type { EventCategory, EventMetadata, EventSeverity } from "@/types/event";
import type { UserRole } from "@/types/user";

type RecordOperationalEventInput = {
  category: EventCategory;
  action: string;
  severity?: EventSeverity;
  title: string;
  description: string;
  trainId?: string | null;
  trainCode?: string | null;
  trainLabel?: string | null;
  actorId?: string | null;
  actorLabel?: string | null;
  actorRole?: UserRole | null;
  metadata?: EventMetadata;
};

function sanitizeMetadata(metadata?: EventMetadata) {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

export async function recordOperationalEvent(input: RecordOperationalEventInput) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  const db = getFirebaseAdminDb();
  const now = new Date().toISOString();
  const event = {
    category: input.category,
    action: input.action,
    severity: input.severity ?? "info",
    title: input.title,
    description: input.description,
    trainId: input.trainId ?? null,
    trainCode: input.trainCode ?? null,
    trainLabel: input.trainLabel ?? null,
    actorId: input.actorId ?? null,
    actorLabel: input.actorLabel ?? null,
    actorRole: input.actorRole ?? null,
    createdAt: now,
    metadata: sanitizeMetadata(input.metadata)
  };

  const ref = await db.collection("events").add(event);
  return ref.id;
}
