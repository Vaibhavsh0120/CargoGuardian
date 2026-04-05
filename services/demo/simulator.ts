import "server-only";

import { publishBlynkDeviceBatchViaMqtt } from "@/services/blynk/device-mqtt";
import type { DemoWeightWarningState, PersistedDemoSimulationState } from "@/services/demo/control";

const ROUTES = [
  { startLat: 32.0809, startLng: 34.7806, endLat: 31.7683, endLng: 35.2137 },
  { startLat: 32.794, startLng: 34.9896, endLat: 31.0461, endLng: 34.8516 },
  { startLat: 31.7683, startLng: 35.2137, endLat: 29.5581, endLng: 34.9482 },
  { startLat: 32.0809, startLng: 34.7806, endLat: 32.794, endLng: 34.9896 },
  { startLat: 31.0461, startLng: 34.8516, endLat: 31.7683, endLng: 35.2137 }
] as const;

export function createInitialDemoSimulationState(): PersistedDemoSimulationState {
  return {
    weightKg: 8400,
    gpsLat: ROUTES[1].startLat,
    gpsLng: ROUTES[1].startLng,
    speedKmh: 82,
    clearanceLed: true,
    weightWarningState: 0,
    rfidLastScan: null,
    rfidLastTag: null,
    trainPower: true,
    signalStrength: -61,
    moving: true,
    routeProgress: 34,
    lastRfidScanAt: 0,
    routeIndex: 1
  };
}

export function advanceDemoSimulationState(
  currentState: PersistedDemoSimulationState,
  overrideWeightWarningState: DemoWeightWarningState
): PersistedDemoSimulationState {
  const nextState = { ...currentState };
  const route = ROUTES[nextState.routeIndex % ROUTES.length];

  if (!nextState.trainPower) {
    nextState.speedKmh = 0;
    nextState.signalStrength = -110;
    return nextState;
  }

  if (nextState.moving) {
    nextState.routeProgress = Math.min(100, nextState.routeProgress + 2.2 + Math.random() * 1.1);
    nextState.gpsLat = lerp(route.startLat, route.endLat, nextState.routeProgress / 100);
    nextState.gpsLng = lerp(route.startLng, route.endLng, nextState.routeProgress / 100);
    nextState.speedKmh = Math.max(0, Math.round(addNoise(85, 18)));
    nextState.signalStrength = Math.round(clamp(addNoise(nextState.signalStrength, 5), -95, -40));
    nextState.weightKg = Math.max(0, Math.round(addNoise(nextState.weightKg, 180)));

    if (nextState.routeProgress >= 100) {
      nextState.routeProgress = 0;
      nextState.routeIndex = (nextState.routeIndex + 1) % ROUTES.length;
      nextState.gpsLat = route.startLat;
      nextState.gpsLng = route.startLng;
    }

    const now = Date.now();
    if (now - nextState.lastRfidScanAt > 30000) {
      nextState.rfidLastScan = new Date().toISOString();
      nextState.rfidLastTag = `RFID-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      nextState.lastRfidScanAt = now;
      nextState.clearanceLed = true;
    }
  } else {
    nextState.speedKmh = 0;
    nextState.signalStrength = Math.round(clamp(addNoise(nextState.signalStrength, 3), -85, -45));
    nextState.weightKg = Math.max(0, Math.round(addNoise(nextState.weightKg, 60)));
  }

  applyWeightWarningOverride(nextState, overrideWeightWarningState);

  return nextState;
}

export async function publishDemoStateToBlynk(state: PersistedDemoSimulationState) {
  const authToken = process.env.DEMO_BLYNK_AUTH_TOKEN?.trim();
  if (!authToken) {
    throw new Error("DEMO_BLYNK_AUTH_TOKEN must be configured.");
  }

  await publishBlynkDeviceBatchViaMqtt(authToken, {
    weightKg: state.weightKg,
    gpsLat: Number(state.gpsLat.toFixed(6)),
    gpsLng: Number(state.gpsLng.toFixed(6)),
    clearanceLed: state.clearanceLed ? 1 : 0,
    weightWarningState: state.weightWarningState,
    rfidLastScan: state.rfidLastScan ?? "",
    rfidLastTag: state.rfidLastTag ?? "",
    signalStrength: state.signalStrength
  });
}

function applyWeightWarningOverride(
  state: PersistedDemoSimulationState,
  overrideWeightWarningState: DemoWeightWarningState
) {
  state.weightWarningState = overrideWeightWarningState;

  if (overrideWeightWarningState === -1) {
    state.weightKg = Math.max(5000, Math.round(addNoise(6400, 60)));
    return;
  }

  if (overrideWeightWarningState === 1) {
    state.weightKg = Math.max(15000, Math.round(addNoise(15750, 90)));
    return;
  }

  state.weightKg = Math.max(8000, Math.round(addNoise(state.weightKg, 120)));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function addNoise(value: number, variance: number) {
  return value + (Math.random() - 0.5) * variance;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
