import "server-only";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { getOptionalIsoString, getString, getNumber } from "@/services/telemetry/derive";
import { recordOperationalEvent } from "@/services/events/write";
import type { AlertDetails, AlertRecord, AlertSeverity, AlertType } from "@/types/alert";
import type { JourneyStage, WeightStatus } from "@/types/train";
import type { UserRole } from "@/types/user";

type RawRecord = Record<string, unknown>;

type AlertActor = {
  actorId?: string | null;
  actorLabel?: string | null;
  actorRole?: UserRole | null;
};

type ActivateAlertInput = AlertActor & {
  trainId: string;
  trainCode: string;
  trainLabel: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  journeyStage: JourneyStage;
  weightStatus: WeightStatus;
  weightKg?: number | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  telemetryReportedAt?: string | null;
  details?: AlertDetails;
};

type ResolveAlertInput = AlertActor & {
  trainId: string;
  trainCode: string;
  trainLabel: string;
  type: AlertType;
  resolutionNote: string;
};

function buildAlertId(trainId: string, type: AlertType) {
  return `${trainId}__${type}`;
}

function sanitizeDetails(details?: AlertDetails) {
  if (!details) {
    return {};
  }

  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined));
}

function normalizeAlertType(value: unknown): AlertType {
  return value === "overweight" ||
    value === "underweight" ||
    value === "offline" ||
    value === "transit-weight-change"
    ? value
    : "offline";
}

function normalizeAlertSeverity(value: unknown): AlertSeverity {
  return value === "low" || value === "medium" || value === "high" || value === "critical" ? value : "medium";
}

function mapAlert(id: string, raw: RawRecord): AlertRecord {
  return {
    id,
    trainId: getString(raw.trainId) ?? id,
    trainCode: getString(raw.trainCode) ?? "UNKNOWN",
    trainLabel: getString(raw.trainLabel) ?? getString(raw.trainCode) ?? "Unknown train",
    type: normalizeAlertType(raw.type),
    status: raw.status === "acknowledged" || raw.status === "resolved" ? raw.status : "open",
    severity: normalizeAlertSeverity(raw.severity),
    title: getString(raw.title) ?? "Alert",
    description: getString(raw.description) ?? "Operational alert raised.",
    journeyStage:
      raw.journeyStage === "clearance-pending" ||
      raw.journeyStage === "cleared" ||
      raw.journeyStage === "in-transit" ||
      raw.journeyStage === "incident" ||
      raw.journeyStage === "offline"
        ? raw.journeyStage
        : "inspection",
    weightStatus:
      raw.weightStatus === "safe" || raw.weightStatus === "underweight" || raw.weightStatus === "overweight"
        ? raw.weightStatus
        : "unknown",
    weightKg: getNumber(raw.weightKg),
    gpsLat: getNumber(raw.gpsLat),
    gpsLng: getNumber(raw.gpsLng),
    telemetryReportedAt: getOptionalIsoString(raw.telemetryReportedAt),
    detectedAt: getOptionalIsoString(raw.detectedAt) ?? new Date().toISOString(),
    lastObservedAt: getOptionalIsoString(raw.lastObservedAt) ?? new Date().toISOString(),
    acknowledgedAt: getOptionalIsoString(raw.acknowledgedAt),
    acknowledgedBy: getString(raw.acknowledgedBy),
    resolvedAt: getOptionalIsoString(raw.resolvedAt),
    resolvedBy: getString(raw.resolvedBy),
    occurrenceCount: getNumber(raw.occurrenceCount) ?? 1,
    details: (raw.details as AlertDetails | undefined) ?? {}
  };
}

function toEventSeverity(severity: AlertSeverity) {
  return severity === "critical" ? "critical" : severity === "high" ? "warning" : "info";
}

export async function activateAlert(input: ActivateAlertInput): Promise<AlertRecord | null> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  const db = getFirebaseAdminDb();
  const alertId = buildAlertId(input.trainId, input.type);
  const now = new Date().toISOString();
  const docRef = db.collection("alerts").doc(alertId);
  const doc = await docRef.get();
  const existing = doc.exists ? mapAlert(doc.id, doc.data() as RawRecord) : null;

  const nextOccurrenceCount = existing ? existing.occurrenceCount + (existing.status === "resolved" ? 1 : 0) : 1;
  const nextStatus: AlertRecord["status"] = existing?.status === "acknowledged" ? "acknowledged" : "open";
  const payload: Omit<AlertRecord, "id"> = {
    trainId: input.trainId,
    trainCode: input.trainCode,
    trainLabel: input.trainLabel,
    type: input.type,
    severity: input.severity,
    status: nextStatus,
    title: input.title,
    description: input.description,
    journeyStage: input.journeyStage,
    weightStatus: input.weightStatus,
    weightKg: input.weightKg ?? null,
    gpsLat: input.gpsLat ?? null,
    gpsLng: input.gpsLng ?? null,
    telemetryReportedAt: input.telemetryReportedAt ?? null,
    detectedAt: existing?.status === "resolved" || !existing ? now : existing.detectedAt,
    lastObservedAt: now,
    acknowledgedAt: existing?.status === "acknowledged" ? existing.acknowledgedAt : null,
    acknowledgedBy: existing?.status === "acknowledged" ? existing.acknowledgedBy : null,
    resolvedAt: null,
    resolvedBy: null,
    occurrenceCount: nextOccurrenceCount,
    details: sanitizeDetails(input.details)
  };

  await docRef.set(payload, { merge: true });

  if (!existing) {
    await recordOperationalEvent({
      category: "alert",
      action: "alert-created",
      severity: toEventSeverity(input.severity),
      title: input.title,
      description: input.description,
      trainId: input.trainId,
      trainCode: input.trainCode,
      trainLabel: input.trainLabel,
      actorId: input.actorId ?? "system",
      actorLabel: input.actorLabel ?? "System",
      actorRole: input.actorRole ?? null,
      metadata: {
        alertType: input.type,
        alertStatus: "open",
        severity: input.severity
      }
    });
  } else if (existing.status === "resolved") {
    await recordOperationalEvent({
      category: "alert",
      action: "alert-reopened",
      severity: toEventSeverity(input.severity),
      title: input.title,
      description: `${input.description} The alert condition returned.`,
      trainId: input.trainId,
      trainCode: input.trainCode,
      trainLabel: input.trainLabel,
      actorId: input.actorId ?? "system",
      actorLabel: input.actorLabel ?? "System",
      actorRole: input.actorRole ?? null,
      metadata: {
        alertType: input.type,
        alertStatus: "open",
        severity: input.severity
      }
    });
  }

  return {
    id: alertId,
    ...payload
  };
}

export async function resolveAlertByRule(input: ResolveAlertInput): Promise<void> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return;
  }

  const db = getFirebaseAdminDb();
  const alertId = buildAlertId(input.trainId, input.type);
  const docRef = db.collection("alerts").doc(alertId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return;
  }

  const existing = mapAlert(doc.id, doc.data() as RawRecord);
  if (existing.status === "resolved") {
    return;
  }

  const now = new Date().toISOString();
  await docRef.set(
    {
      status: "resolved",
      resolvedAt: now,
      resolvedBy: input.actorLabel ?? "System",
      lastObservedAt: now,
      details: {
        ...existing.details,
        resolutionNote: input.resolutionNote
      }
    },
    { merge: true }
  );

  await recordOperationalEvent({
    category: "alert",
    action: "alert-resolved",
    severity: existing.severity === "critical" ? "critical" : "info",
    title: existing.title,
    description: input.resolutionNote,
    trainId: existing.trainId,
    trainCode: existing.trainCode,
    trainLabel: existing.trainLabel,
    actorId: input.actorId ?? "system",
    actorLabel: input.actorLabel ?? "System",
    actorRole: input.actorRole ?? null,
    metadata: {
      alertType: existing.type,
      previousStatus: existing.status
    }
  });
}

export async function acknowledgeAlertById(
  alertId: string,
  actor: Required<Pick<AlertActor, "actorId" | "actorLabel">> & Pick<AlertActor, "actorRole">
): Promise<AlertRecord | null> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  const db = getFirebaseAdminDb();
  const docRef = db.collection("alerts").doc(alertId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const existing = mapAlert(doc.id, doc.data() as RawRecord);
  if (existing.status !== "open") {
    return existing;
  }

  const now = new Date().toISOString();
  await docRef.set(
    {
      status: "acknowledged",
      acknowledgedAt: now,
      acknowledgedBy: actor.actorLabel,
      lastObservedAt: now
    },
    { merge: true }
  );

  await recordOperationalEvent({
    category: "alert",
    action: "alert-acknowledged",
    severity: existing.severity === "critical" ? "critical" : "warning",
    title: existing.title,
    description: `${actor.actorLabel} acknowledged the alert.`,
    trainId: existing.trainId,
    trainCode: existing.trainCode,
    trainLabel: existing.trainLabel,
    actorId: actor.actorId,
    actorLabel: actor.actorLabel,
    actorRole: actor.actorRole ?? null,
    metadata: {
      alertType: existing.type
    }
  });

  return {
    ...existing,
    status: "acknowledged",
    acknowledgedAt: now,
    acknowledgedBy: actor.actorLabel,
    lastObservedAt: now
  };
}

export async function resolveAlertById(
  alertId: string,
  actor: Required<Pick<AlertActor, "actorId" | "actorLabel">> & Pick<AlertActor, "actorRole">
): Promise<AlertRecord | null> {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  const db = getFirebaseAdminDb();
  const docRef = db.collection("alerts").doc(alertId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const existing = mapAlert(doc.id, doc.data() as RawRecord);
  if (existing.status === "resolved") {
    return existing;
  }

  const now = new Date().toISOString();
  await docRef.set(
    {
      status: "resolved",
      resolvedAt: now,
      resolvedBy: actor.actorLabel,
      lastObservedAt: now
    },
    { merge: true }
  );

  await recordOperationalEvent({
    category: "alert",
    action: "alert-resolved",
    severity: existing.severity === "critical" ? "critical" : "info",
    title: existing.title,
    description: `${actor.actorLabel} resolved the alert.`,
    trainId: existing.trainId,
    trainCode: existing.trainCode,
    trainLabel: existing.trainLabel,
    actorId: actor.actorId,
    actorLabel: actor.actorLabel,
    actorRole: actor.actorRole ?? null,
    metadata: {
      alertType: existing.type
    }
  });

  return {
    ...existing,
    status: "resolved",
    resolvedAt: now,
    resolvedBy: actor.actorLabel,
    lastObservedAt: now
  };
}
