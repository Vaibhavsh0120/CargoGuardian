import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { logger } from "@/lib/logger";
import type { Train } from "@/types/train";

export type BlynkDatastreamPin = `v${number}`;
export type BlynkDatastreamValue = string | number | boolean | null;

type BlynkExternalApiError = {
  error?: {
    message?: string;
  };
};

function getBlynkBaseUrl() {
  const env = getServerEnv();
  return (env.BLYNK_BASE_URL || "https://blynk.cloud").replace(/\/+$/, "");
}

function requireAuthToken(authToken: string | null | undefined, subject: string) {
  const normalized = authToken?.trim();

  if (!normalized) {
    throw new Error(`${subject} is missing a Blynk Auth Token.`);
  }

  return normalized;
}

async function readBlynkErrorMessage(response: Response) {
  const body = await response.text();

  if (!body) {
    return `status ${response.status}`;
  }

  try {
    const parsed = JSON.parse(body) as BlynkExternalApiError;
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Fall back to the raw body when Blynk does not return JSON.
  }

  return body;
}

function stringifyBlynkValue(value: BlynkDatastreamValue) {
  if (value === null) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  return String(value);
}

export async function updateBlynkDeviceDatastreams(
  authToken: string,
  values: Partial<Record<BlynkDatastreamPin, BlynkDatastreamValue>>
) {
  const token = requireAuthToken(authToken, "Blynk device");
  const params = new URLSearchParams({ token });

  for (const [pin, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }

    params.set(pin, stringifyBlynkValue(value));
  }

  const response = await fetch(`${getBlynkBaseUrl()}/external/api/batch/update?${params.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await readBlynkErrorMessage(response);
    throw new Error(`Blynk datastream update failed: ${message}`);
  }
}

export async function getBlynkDeviceConnectionStatus(authToken: string) {
  const token = requireAuthToken(authToken, "Blynk device");
  const response = await fetch(`${getBlynkBaseUrl()}/external/api/isHardwareConnected?token=${encodeURIComponent(token)}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await readBlynkErrorMessage(response);
    throw new Error(`Blynk connection-status read failed: ${message}`);
  }

  const body = (await response.text()).trim().toLowerCase();
  return body === "true";
}

export async function getBlynkDeviceDatastreams(authToken: string) {
  const token = requireAuthToken(authToken, "Blynk device");
  const response = await fetch(`${getBlynkBaseUrl()}/external/api/getAll?token=${encodeURIComponent(token)}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await readBlynkErrorMessage(response);
    throw new Error(`Blynk datastream read failed: ${message}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function getTrainBlynkSnapshot(train: Pick<Train, "code" | "blynkAuthToken" | "blynkDeviceId">) {
  const authToken = requireAuthToken(train.blynkAuthToken, `Train ${train.code}`);
  const [connected, values] = await Promise.all([
    getBlynkDeviceConnectionStatus(authToken),
    getBlynkDeviceDatastreams(authToken)
  ]);

  return {
    trainCode: train.code,
    blynkDeviceId: train.blynkDeviceId,
    connected,
    values,
    fetchedAt: new Date().toISOString(),
    source: "blynk-device-https-api" as const
  };
}

export async function syncTrainClearanceLed(train: Pick<Train, "code" | "blynkAuthToken">, enabled: boolean) {
  const authToken = requireAuthToken(train.blynkAuthToken, `Train ${train.code}`);
  await updateBlynkDeviceDatastreams(authToken, {
    v3: enabled ? 1 : 0
  });

  logger.info(`Synced clearance LED for ${train.code} via Blynk device API: ${enabled ? "on" : "off"}`);
}
