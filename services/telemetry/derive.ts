import "server-only";

import { normalizeJourneyStage } from "@/services/trains/access";
import type {
  TelemetryFreshnessState,
  TelemetryMovementState,
  WeightWarningLabel
} from "@/types/telemetry";
import type { JourneyStage, TrainStatus, WeightStatus } from "@/types/train";

type TimestampLike = {
  toDate: () => Date;
};

type TelemetryPointForSpeed = {
  gpsLat: number | null;
  gpsLng: number | null;
  recordedAt: string | null;
};

export const TELEMETRY_STALE_AFTER_SECONDS = 30;
export const TELEMETRY_OFFLINE_AFTER_SECONDS = 120;

const MIN_DISTANCE_METERS = 25;
const MIN_MOVING_SPEED_KMH = 3;
const MAX_DERIVED_SPEED_KMH = 220;

export function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function getBoolean(value: unknown, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "1" || normalized === "true") {
      return true;
    }

    if (normalized === "0" || normalized === "false") {
      return false;
    }
  }

  return defaultValue;
}

export function getOptionalIsoString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as TimestampLike).toDate().toISOString();
  }

  return null;
}

export function normalizeWeightWarningState(value: unknown, legacyColor?: unknown, legacyErrorLed?: unknown): -1 | 0 | 1 {
  if (value === -1 || value === 0 || value === 1) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (parsed === -1 || parsed === 0 || parsed === 1) {
      return parsed;
    }
  }

  if (legacyColor === "orange") {
    return -1;
  }

  if (legacyColor === "red") {
    return 1;
  }

  return getBoolean(legacyErrorLed) ? 1 : 0;
}

export function weightWarningStateToLabel(weightWarningState: -1 | 0 | 1): WeightWarningLabel {
  if (weightWarningState === -1) {
    return "underweight";
  }

  if (weightWarningState === 1) {
    return "overweight";
  }

  return "safe";
}

export function deriveWeightStatus(weightKg: number | null, weightWarningState: -1 | 0 | 1): WeightStatus {
  if (weightWarningState === 1) {
    return "overweight";
  }

  if (weightWarningState === -1) {
    return "underweight";
  }

  return weightKg === null ? "unknown" : "safe";
}

export function deriveTelemetryFreshness(
  reportedAt: string | null,
  now = new Date()
): {
  state: TelemetryFreshnessState;
  ageSeconds: number | null;
  isStale: boolean;
  isOffline: boolean;
} {
  if (!reportedAt) {
    return {
      state: "offline",
      ageSeconds: null,
      isStale: true,
      isOffline: true
    };
  }

  const parsed = new Date(reportedAt);
  if (Number.isNaN(parsed.getTime())) {
    return {
      state: "offline",
      ageSeconds: null,
      isStale: true,
      isOffline: true
    };
  }

  const ageSeconds = Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 1000));

  if (ageSeconds >= TELEMETRY_OFFLINE_AFTER_SECONDS) {
    return {
      state: "offline",
      ageSeconds,
      isStale: true,
      isOffline: true
    };
  }

  if (ageSeconds >= TELEMETRY_STALE_AFTER_SECONDS) {
    return {
      state: "stale",
      ageSeconds,
      isStale: true,
      isOffline: false
    };
  }

  return {
    state: "fresh",
    ageSeconds,
    isStale: false,
    isOffline: false
  };
}

export function deriveMovementState(speedKmh: number | null): TelemetryMovementState {
  if (speedKmh === null) {
    return "unknown";
  }

  return speedKmh >= MIN_MOVING_SPEED_KMH ? "moving" : "stationary";
}

export function deriveTelemetryTrainStatus(input: {
  freshnessState: TelemetryFreshnessState;
  weightWarningState: -1 | 0 | 1;
  speedKmh: number | null;
}): TrainStatus {
  if (input.freshnessState === "offline") {
    return "offline";
  }

  if (input.weightWarningState === 1) {
    return "critical";
  }

  if (input.weightWarningState === -1) {
    return "warning";
  }

  return deriveMovementState(input.speedKmh) === "moving" ? "active" : "idle";
}

export function deriveDisplayJourneyStage(
  journeyStage: unknown,
  freshnessState: TelemetryFreshnessState
): JourneyStage {
  if (freshnessState === "offline") {
    return "offline";
  }

  return normalizeJourneyStage(journeyStage);
}

export function deriveSpeedFromTelemetryPoints(
  current: TelemetryPointForSpeed,
  previous: TelemetryPointForSpeed | null
): number | null {
  if (!previous) {
    return null;
  }

  if (
    current.gpsLat === null ||
    current.gpsLng === null ||
    previous.gpsLat === null ||
    previous.gpsLng === null ||
    !current.recordedAt ||
    !previous.recordedAt
  ) {
    return null;
  }

  const currentTime = new Date(current.recordedAt).getTime();
  const previousTime = new Date(previous.recordedAt).getTime();
  const deltaMs = currentTime - previousTime;

  if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
    return null;
  }

  const distanceKm = haversineDistanceKm(current.gpsLat, current.gpsLng, previous.gpsLat, previous.gpsLng);
  const distanceMeters = distanceKm * 1000;

  if (distanceMeters < MIN_DISTANCE_METERS) {
    return 0;
  }

  const speedKmh = distanceKm / (deltaMs / 3_600_000);

  if (!Number.isFinite(speedKmh) || speedKmh < 0) {
    return null;
  }

  return Number(Math.min(speedKmh, MAX_DERIVED_SPEED_KMH).toFixed(1));
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
