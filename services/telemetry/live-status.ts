import "server-only";

import { logger } from "@/lib/logger";
import { getBlynkDeviceConnectionStatus } from "@/services/blynk/device";
import type { Train } from "@/types/train";

type FreshnessLike = {
  state: "fresh" | "stale" | "offline";
  ageSeconds: number | null;
  isStale: boolean;
  isOffline: boolean;
};

type TrainConnectionShape = Pick<Train, "id" | "blynkAuthToken">;

export function hasLinkedBlynkAuthToken(authToken: string | null | undefined) {
  const normalized = authToken?.trim();
  return Boolean(normalized);
}

export async function getBlynkConnectionOverrides<T extends TrainConnectionShape>(trains: T[]) {
  const overrides = new Map<string, boolean | null>();
  const linkedTrains = trains.filter((train) => hasLinkedBlynkAuthToken(train.blynkAuthToken));

  await Promise.all(
    linkedTrains.map(async (train) => {
      try {
        overrides.set(train.id, await getBlynkDeviceConnectionStatus(train.blynkAuthToken ?? ""));
      } catch (error) {
        logger.warn(`Failed to read Blynk connection status for train ${train.id}.`, error);
        overrides.set(train.id, null);
      }
    })
  );

  return overrides;
}

export function applyBlynkConnectionToFreshness<T extends FreshnessLike>(freshness: T, isConnected: boolean | null) {
  if (isConnected !== false) {
    return freshness;
  }

  return {
    ...freshness,
    state: "offline" as const,
    isStale: true,
    isOffline: true
  };
}

export function applyBlynkConnectionToTrain(train: Train, isConnected: boolean | null): Train {
  if (isConnected !== false) {
    return train;
  }

  return {
    ...train,
    status: "offline",
    journeyStage: "offline"
  };
}
