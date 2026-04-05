import "server-only";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { syncFreshnessAlertsForTrains } from "@/services/alerts/rules";
import { listAccessibleTrains } from "@/services/trains/read";
import { getNumber, getOptionalIsoString, getString } from "@/services/telemetry/derive";
import type { AlertListResponse, AlertRecord, AlertSeverity, AlertStatus, AlertType } from "@/types/alert";
import type { AppUser } from "@/types/user";

type RawRecord = Record<string, unknown>;

type AlertListQuery = {
  trainId?: string;
  status?: AlertStatus | "active" | "all";
  severity?: AlertSeverity | "all";
  type?: AlertType | "all";
  limit?: number;
};

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
    details: (raw.details as AlertRecord["details"] | undefined) ?? {}
  };
}

function sortAlertsByObservedAtDesc(left: AlertRecord, right: AlertRecord) {
  return new Date(right.lastObservedAt).getTime() - new Date(left.lastObservedAt).getTime();
}

function matchesStatus(alert: AlertRecord, status: AlertListQuery["status"]) {
  if (!status || status === "all") {
    return true;
  }

  if (status === "active") {
    return alert.status === "open" || alert.status === "acknowledged";
  }

  return alert.status === status;
}

function summarizeAlerts(alerts: AlertRecord[]): AlertListResponse["summary"] {
  return {
    total: alerts.length,
    open: alerts.filter((alert) => alert.status === "open").length,
    acknowledged: alerts.filter((alert) => alert.status === "acknowledged").length,
    resolved: alerts.filter((alert) => alert.status === "resolved").length,
    critical: alerts.filter((alert) => alert.severity === "critical").length,
    high: alerts.filter((alert) => alert.severity === "high").length,
    medium: alerts.filter((alert) => alert.severity === "medium").length,
    low: alerts.filter((alert) => alert.severity === "low").length
  };
}

export async function listAlerts(query: AlertListQuery, user?: AppUser): Promise<AlertListResponse> {
  const fetchedAt = new Date().toISOString();

  if (!process.env.FIREBASE_PROJECT_ID) {
    return {
      alerts: [],
      summary: summarizeAlerts([]),
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
  const filteredTrains = query.trainId
    ? accessibleTrains.filter((train) => train.id === query.trainId)
    : accessibleTrains;

  await syncFreshnessAlertsForTrains(filteredTrains);

  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("alerts").get();
  const alerts = snapshot.docs
    .map((doc) => mapAlert(doc.id, doc.data() as RawRecord))
    .filter((alert) => accessibleTrainIds.has(alert.trainId))
    .filter((alert) => (query.trainId ? alert.trainId === query.trainId : true))
    .filter((alert) => matchesStatus(alert, query.status))
    .filter((alert) => (query.severity && query.severity !== "all" ? alert.severity === query.severity : true))
    .filter((alert) => (query.type && query.type !== "all" ? alert.type === query.type : true))
    .sort(sortAlertsByObservedAtDesc);

  return {
    alerts: alerts.slice(0, query.limit ?? 100),
    summary: summarizeAlerts(alerts),
    fetchedAt
  };
}
