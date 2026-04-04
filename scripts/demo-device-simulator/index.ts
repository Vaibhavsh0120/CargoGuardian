import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type TrainTarget = {
  id: string;
  code: string;
  label: string;
  blynkAuthToken: string | null;
};

type SimulationState = {
  weightKg: number;
  gpsLat: number;
  gpsLng: number;
  speedKmh: number;
  clearanceLed: boolean;
  weightWarningState: -1 | 0 | 1;
  rfidLastScan: string | null;
  rfidLastTag: string | null;
  trainPower: boolean;
  signalStrength: number;
  moving: boolean;
  routeProgress: number;
  lastRfidScanAt: number;
};

const ROUTES = [
  { startLat: 32.0809, startLng: 34.7806, endLat: 31.7683, endLng: 35.2137 },
  { startLat: 32.794, startLng: 34.9896, endLat: 31.0461, endLng: 34.8516 },
  { startLat: 31.7683, startLng: 35.2137, endLat: 29.5581, endLng: 34.9482 },
  { startLat: 32.0809, startLng: 34.7806, endLat: 32.794, endLng: 34.9896 },
  { startLat: 31.0461, startLng: 34.8516, endLat: 31.7683, endLng: 35.2137 }
] as const;

const SCENARIOS: Array<Omit<SimulationState, "rfidLastScan" | "rfidLastTag" | "lastRfidScanAt">> = [
  {
    weightKg: 12500,
    gpsLat: ROUTES[0].startLat,
    gpsLng: ROUTES[0].startLng,
    speedKmh: 0,
    clearanceLed: false,
    weightWarningState: 0,
    trainPower: true,
    signalStrength: 86,
    moving: false,
    routeProgress: 0
  },
  {
    weightKg: 8400,
    gpsLat: ROUTES[1].startLat,
    gpsLng: ROUTES[1].startLng,
    speedKmh: 82,
    clearanceLed: true,
    weightWarningState: -1,
    trainPower: true,
    signalStrength: 74,
    moving: true,
    routeProgress: 34
  },
  {
    weightKg: 0,
    gpsLat: ROUTES[2].startLat,
    gpsLng: ROUTES[2].startLng,
    speedKmh: 0,
    clearanceLed: false,
    weightWarningState: 0,
    trainPower: false,
    signalStrength: 0,
    moving: false,
    routeProgress: 0
  },
  {
    weightKg: 15750,
    gpsLat: ROUTES[3].startLat,
    gpsLng: ROUTES[3].startLng,
    speedKmh: 91,
    clearanceLed: true,
    weightWarningState: 1,
    trainPower: true,
    signalStrength: 92,
    moving: true,
    routeProgress: 58
  },
  {
    weightKg: 6400,
    gpsLat: ROUTES[4].startLat,
    gpsLng: ROUTES[4].startLng,
    speedKmh: 0,
    clearanceLed: false,
    weightWarningState: -1,
    trainPower: true,
    signalStrength: 42,
    moving: false,
    routeProgress: 81
  }
];

function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const filePath = join(process.cwd(), filename);
    if (!existsSync(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getDb() {
  if (getApps().length) {
    return getFirestore(getApp());
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID must be configured for the demo simulator.");
  }

  const app =
    clientEmail && privateKey
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey
          })
        })
      : initializeApp({ projectId });

  return getFirestore(app);
}

async function listTrains(): Promise<TrainTarget[]> {
  const snapshot = await getDb().collection("trains").orderBy("label").limit(25).get();
  const trains = snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;

    return {
      id: doc.id,
      code: typeof data.code === "string" ? data.code : doc.id.toUpperCase(),
      label: typeof data.label === "string" ? data.label : doc.id,
      blynkAuthToken: typeof data.blynkAuthToken === "string" ? data.blynkAuthToken : null
    };
  });

  const demoTrain = trains.find((train) => /demo/i.test(`${train.code} ${train.label}`));
  return demoTrain ? [demoTrain] : [];
}

async function readDemoWeightWarningState(): Promise<-1 | 0 | 1 | null> {
  const snapshot = await getDb().collection("systemStatus").doc("demoSimulator").get();
  if (!snapshot.exists) {
    return null;
  }

  const value = snapshot.data()?.weightWarningState;
  return value === -1 || value === 0 || value === 1 ? value : null;
}

function createInitialState(index: number): SimulationState {
  const template = SCENARIOS[index % SCENARIOS.length];

  return {
    ...template,
    rfidLastScan: null,
    rfidLastTag: null,
    lastRfidScanAt: 0
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function addNoise(value: number, variance: number) {
  return value + (Math.random() - 0.5) * variance;
}

function updateState(state: SimulationState, index: number) {
  const route = ROUTES[index % ROUTES.length];

  if (!state.trainPower) {
    state.speedKmh = 0;
    state.signalStrength = 0;
    return;
  }

  if (state.moving) {
    state.routeProgress = Math.min(100, state.routeProgress + 0.45 + Math.random() * 0.35);
    state.gpsLat = lerp(route.startLat, route.endLat, state.routeProgress / 100);
    state.gpsLng = lerp(route.startLng, route.endLng, state.routeProgress / 100);
    state.speedKmh = Math.max(0, Math.round(addNoise(85, 18)));
    state.signalStrength = Math.min(100, Math.max(28, Math.round(addNoise(state.signalStrength, 6))));
    state.weightKg = Math.max(0, Math.round(addNoise(state.weightKg, 45)));

    if (state.routeProgress >= 100) {
      state.moving = false;
      state.speedKmh = 0;
    }

    const now = Date.now();
    if (now - state.lastRfidScanAt > 30000) {
      state.rfidLastScan = new Date().toISOString();
      state.rfidLastTag = `RFID-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      state.lastRfidScanAt = now;
      state.clearanceLed = true;
    }
  } else {
    state.speedKmh = 0;
    state.signalStrength = Math.min(100, Math.max(45, Math.round(addNoise(state.signalStrength, 3))));
    state.weightKg = Math.max(0, Math.round(addNoise(state.weightKg, 10)));
  }

  if (index % SCENARIOS.length === 4) {
    state.weightWarningState = Math.random() > 0.65 ? 1 : -1;
    state.signalStrength = Math.min(60, Math.max(20, Math.round(addNoise(state.signalStrength, 10))));
  }
}

function applyDemoControlState(state: SimulationState, override: -1 | 0 | 1 | null) {
  if (override === null) {
    return;
  }

  state.weightWarningState = override;

  if (override === -1) {
    state.weightKg = Math.max(5000, Math.round(addNoise(6400, 40)));
    return;
  }

  if (override === 1) {
    state.weightKg = Math.max(15000, Math.round(addNoise(15750, 45)));
    return;
  }

  state.weightKg = Math.max(10000, Math.round(addNoise(12500, 35)));
}

async function sendTelemetry(train: TrainTarget, state: SimulationState) {
  const response = await fetch(`${getAppUrl()}/api/telemetry/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.BLYNK_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.BLYNK_WEBHOOK_SECRET}` } : {})
    },
    body: JSON.stringify({
      deviceId: train.code,
      weightKg: state.weightKg,
      gpsLat: state.gpsLat,
      gpsLng: state.gpsLng,
      speedKmh: state.speedKmh,
      clearanceLed: state.clearanceLed,
      weightWarningState: state.weightWarningState,
      rfidLastScan: state.rfidLastScan,
      rfidLastTag: state.rfidLastTag,
      trainPower: state.trainPower,
      signalStrength: state.signalStrength
    })
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? `Telemetry request failed with status ${response.status}.`);
  }
}

async function syncBlynkDatastreams(train: TrainTarget, state: SimulationState) {
  if (!train.blynkAuthToken) {
    return;
  }

  const params = new URLSearchParams({
    token: train.blynkAuthToken,
    v0: String(state.weightKg),
    v1: String(state.gpsLat),
    v2: String(state.gpsLng),
    v3: state.clearanceLed ? "1" : "0",
    v4: String(state.weightWarningState),
    v5: state.rfidLastScan ?? "",
    v6: state.rfidLastTag ?? "",
    v7: String(state.signalStrength)
  });

  const baseUrl = process.env.BLYNK_BASE_URL || "https://blynk.cloud";
  const response = await fetch(`${baseUrl}/external/api/batch/update?${params.toString()}`, {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(`Blynk sync failed with status ${response.status}.`);
  }
}

async function main() {
  loadLocalEnv();

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    console.log("Demo mode is disabled. Set NEXT_PUBLIC_DEMO_MODE=true to run the simulator.");
    return;
  }

  console.log("Starting demo train telemetry simulator...");
  console.log(`Target: ${getAppUrl()}`);

  const trains = await listTrains();

  if (!trains.length) {
    console.log('No demo train found. Create one train whose code or label contains "DEMO" before starting the simulator.');
    return;
  }

  const simulations = trains.map((train, index) => ({
    train,
    state: createInitialState(index)
  }));

  console.log(`Loaded demo train: ${simulations[0]?.train.code ?? "unknown"}`);
  console.log("Sending telemetry every 5 seconds. Press Ctrl+C to stop.");

  let tick = 0;

  setInterval(async () => {
    tick += 1;
    const overrideState = await readDemoWeightWarningState().catch(() => null);

    for (const [index, entry] of simulations.entries()) {
      updateState(entry.state, index);
      applyDemoControlState(entry.state, overrideState);
      void sendTelemetry(entry.train, entry.state).catch((error) => {
        console.log(`Telemetry failed for ${entry.train.code}: ${error instanceof Error ? error.message : String(error)}`);
      });
      void syncBlynkDatastreams(entry.train, entry.state).catch((error) => {
        console.log(`Blynk sync failed for ${entry.train.code}: ${error instanceof Error ? error.message : String(error)}`);
      });
    }

    console.log(`[${new Date().toISOString()}] Tick ${tick} | demo train updated`);
  }, 5000);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
