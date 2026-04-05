import type { JourneyStage, TrainStatus, WeightStatus } from "@/types/train";

export const TELEMETRY_FRESHNESS_VALUES = ["fresh", "stale", "offline"] as const;

export type TelemetryFreshnessState = (typeof TELEMETRY_FRESHNESS_VALUES)[number];

export const TELEMETRY_MOVEMENT_VALUES = ["moving", "stationary", "unknown"] as const;

export type TelemetryMovementState = (typeof TELEMETRY_MOVEMENT_VALUES)[number];

export const WEIGHT_WARNING_LABEL_VALUES = ["underweight", "safe", "overweight"] as const;

export type WeightWarningLabel = (typeof WEIGHT_WARNING_LABEL_VALUES)[number];

export type TelemetrySnapshot = {
  trainId: string;
  trainCode: string;
  trainLabel: string;
  status: TrainStatus;
  journeyStage: JourneyStage;
  displayJourneyStage: JourneyStage;
  weightStatus: WeightStatus;
  displayWeightStatus: WeightStatus;
  hasTelemetry: boolean;
  weightKg: number | null;
  gpsLat: number | null;
  gpsLng: number | null;
  speedKmh: number | null;
  movementState: TelemetryMovementState;
  clearanceLed: boolean;
  weightWarningState: -1 | 0 | 1;
  weightWarningLabel: WeightWarningLabel;
  rfidLastScan: string | null;
  rfidLastTag: string | null;
  signalStrength: number | null;
  reportedAt: string | null;
  ageSeconds: number | null;
  freshnessState: TelemetryFreshnessState;
  isStale: boolean;
  isOffline: boolean;
};

export type TelemetryHistoryPoint = {
  id: string;
  trainId: string;
  recordedAt: string;
  weightKg: number | null;
  gpsLat: number | null;
  gpsLng: number | null;
  speedKmh: number | null;
  movementState: TelemetryMovementState;
  clearanceLed: boolean;
  weightWarningState: -1 | 0 | 1;
  signalStrength: number | null;
};

export type TelemetryOverviewSummary = {
  totalTrains: number;
  reportingTrains: number;
  freshTrains: number;
  staleTrains: number;
  offlineTrains: number;
  movingTrains: number;
};

export type TelemetryCurrentListResponse = {
  summary: TelemetryOverviewSummary;
  snapshots: TelemetrySnapshot[];
  fetchedAt: string;
};

export type TelemetryCurrentResponse = {
  telemetry: TelemetrySnapshot;
  fetchedAt: string;
};

export type TelemetryHistoryResponse = {
  trainId: string;
  history: TelemetryHistoryPoint[];
  fetchedAt: string;
};

export type TelemetryStreamEvent = {
  snapshot: TelemetrySnapshot;
  sentAt: string;
};

export const telemetryFreshnessLabels: Record<TelemetryFreshnessState, string> = {
  fresh: "Fresh",
  stale: "Stale",
  offline: "Offline"
};

export const telemetryMovementLabels: Record<TelemetryMovementState, string> = {
  moving: "Moving",
  stationary: "Stationary",
  unknown: "Unknown"
};

export const weightWarningLabels: Record<WeightWarningLabel, string> = {
  underweight: "Underweight",
  safe: "Safe",
  overweight: "Overweight"
};
