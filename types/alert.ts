import type { JourneyStage, WeightStatus } from "@/types/train";

export const ALERT_TYPE_VALUES = ["overweight", "underweight", "offline", "transit-weight-change"] as const;

export type AlertType = (typeof ALERT_TYPE_VALUES)[number];

export const ALERT_STATUS_VALUES = ["open", "acknowledged", "resolved"] as const;

export type AlertStatus = (typeof ALERT_STATUS_VALUES)[number];

export const ALERT_SEVERITY_VALUES = ["low", "medium", "high", "critical"] as const;

export type AlertSeverity = (typeof ALERT_SEVERITY_VALUES)[number];

export type AlertDetailsValue = boolean | number | string | null;

export type AlertDetails = Record<string, AlertDetailsValue>;

export type AlertRecord = {
  id: string;
  trainId: string;
  trainCode: string;
  trainLabel: string;
  type: AlertType;
  status: AlertStatus;
  severity: AlertSeverity;
  title: string;
  description: string;
  journeyStage: JourneyStage;
  weightStatus: WeightStatus;
  weightKg: number | null;
  gpsLat: number | null;
  gpsLng: number | null;
  telemetryReportedAt: string | null;
  detectedAt: string;
  lastObservedAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  occurrenceCount: number;
  details: AlertDetails;
};

export type AlertListSummary = {
  total: number;
  open: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type AlertListResponse = {
  alerts: AlertRecord[];
  summary: AlertListSummary;
  fetchedAt: string;
};

export const alertTypeLabels: Record<AlertType, string> = {
  overweight: "Overweight",
  underweight: "Underweight",
  offline: "Offline",
  "transit-weight-change": "Transit Weight Change"
};

export const alertStatusLabels: Record<AlertStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved"
};

export const alertSeverityLabels: Record<AlertSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};
