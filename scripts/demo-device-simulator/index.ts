import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import mqtt, { type IClientOptions, type MqttClient } from "mqtt";

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
    signalStrength: -48,
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
    signalStrength: -61,
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
    signalStrength: -110,
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
    signalStrength: -43,
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
    signalStrength: -76,
    moving: false,
    routeProgress: 81
  }
];

const MQTT_KEEPALIVE_SECONDS = 45;
const MQTT_INFO_VERSION = "demo-sim-1.0.0";

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

function getDemoBlynkAuthToken() {
  const authToken = process.env.DEMO_BLYNK_AUTH_TOKEN?.trim();

  if (!authToken) {
    throw new Error("DEMO_BLYNK_AUTH_TOKEN must be configured for the demo simulator.");
  }

  return authToken;
}

function getInitialMqttUrl() {
  const explicitUrl = process.env.BLYNK_MQTT_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const baseUrl = process.env.BLYNK_BASE_URL || "https://blynk.cloud";
  const parsed = new URL(baseUrl);
  return `mqtts://${parsed.hostname}:8883`;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function updateState(state: SimulationState, index: number) {
  const route = ROUTES[index % ROUTES.length];

  if (!state.trainPower) {
    state.speedKmh = 0;
    state.signalStrength = -110;
    return;
  }

  if (state.moving) {
    state.routeProgress = Math.min(100, state.routeProgress + 2.2 + Math.random() * 1.1);
    state.gpsLat = lerp(route.startLat, route.endLat, state.routeProgress / 100);
    state.gpsLng = lerp(route.startLng, route.endLng, state.routeProgress / 100);
    state.speedKmh = Math.max(0, Math.round(addNoise(85, 18)));
    state.signalStrength = Math.round(clamp(addNoise(state.signalStrength, 5), -95, -40));
    state.weightKg = Math.max(0, Math.round(addNoise(state.weightKg, 180)));

    if (state.routeProgress >= 100) {
      state.routeProgress = 0;
      state.gpsLat = route.startLat;
      state.gpsLng = route.startLng;
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
    state.signalStrength = Math.round(clamp(addNoise(state.signalStrength, 3), -85, -45));
    state.weightKg = Math.max(0, Math.round(addNoise(state.weightKg, 60)));
  }

  if (index % SCENARIOS.length === 4) {
    state.weightWarningState = Math.random() > 0.65 ? 1 : -1;
    state.signalStrength = Math.round(clamp(addNoise(state.signalStrength, 6), -95, -55));
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

class BlynkDeviceSession {
  private client: MqttClient | null = null;
  private endpoint = getInitialMqttUrl();
  private readyResolve: (() => void) | null = null;
  private readyPromise: Promise<void> = Promise.resolve();
  private redirectedEndpoint: string | null = null;
  private infoPublished = false;

  constructor() {
    this.resetReadyPromise();
  }

  async start() {
    await this.connect(this.endpoint);
    await this.waitUntilReady();
  }

  async publishState(state: SimulationState) {
    await this.waitUntilReady();

    const client = this.client;
    if (!client) {
      throw new Error("Blynk MQTT client is not connected.");
    }

    const payload = JSON.stringify({
      weightKg: state.weightKg,
      gpsLat: Number(state.gpsLat.toFixed(6)),
      gpsLng: Number(state.gpsLng.toFixed(6)),
      clearanceLed: state.clearanceLed ? 1 : 0,
      weightWarningState: state.weightWarningState,
      rfidLastScan: state.rfidLastScan ?? "",
      rfidLastTag: state.rfidLastTag ?? "",
      signalStrength: state.signalStrength
    });

    await this.publish("batch_ds", payload);
  }

  private async connect(endpoint: string) {
    if (this.client) {
      await new Promise<void>((resolve) => {
        this.client?.end(true, {}, () => resolve());
      });
      this.client = null;
    }

    this.resetReadyPromise();

    const options: IClientOptions = {
      username: "device",
      password: getDemoBlynkAuthToken(),
      keepalive: MQTT_KEEPALIVE_SECONDS,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clientId: `cg-demo-${Math.random().toString(16).slice(2, 10)}`
    };

    const client = mqtt.connect(endpoint, options);
    this.client = client;
    this.endpoint = endpoint;
    this.infoPublished = false;

    client.on("connect", () => {
      console.log(`[sim] Connected to Blynk MQTT broker: ${this.endpoint}`);
      client.subscribe("downlink/#", (error) => {
        if (error) {
          console.log(`[sim] Failed to subscribe to downlink/#: ${error.message}`);
          return;
        }

        void this.publishInfo().then(() => {
          if (this.readyResolve) {
            this.readyResolve();
            this.readyResolve = null;
          }
        });
      });
    });

    client.on("reconnect", () => {
      console.log(`[sim] Reconnecting to Blynk MQTT broker: ${this.endpoint}`);
    });

    client.on("close", () => {
      console.log("[sim] Blynk MQTT connection closed.");
    });

    client.on("error", (error) => {
      console.log(`[sim] Blynk MQTT error: ${error.message}`);
    });

    client.on("message", (topic, payloadBuffer) => {
      const payload = payloadBuffer.toString();

      if (topic === "downlink/redirect") {
        const redirectedEndpoint = payload.trim();
        if (redirectedEndpoint && redirectedEndpoint !== this.endpoint && redirectedEndpoint !== this.redirectedEndpoint) {
          this.redirectedEndpoint = redirectedEndpoint;
          console.log(`[sim] Blynk requested redirect to ${redirectedEndpoint}`);
          void this.connect(redirectedEndpoint).catch((error) => {
            console.log(`[sim] Redirect connect failed: ${error instanceof Error ? error.message : String(error)}`);
          });
        }
      }
    });
  }

  private async publishInfo() {
    if (this.infoPublished) {
      return;
    }

    const infoPayload = JSON.stringify({
      tmpl: process.env.BLYNK_TEMPLATE_ID ?? "unknown-template",
      ver: MQTT_INFO_VERSION,
      build: "demo-simulator",
      type: process.env.BLYNK_TEMPLATE_ID ?? "demo-simulator",
      rxbuff: 2048
    });

    await this.publish("info/mcu", infoPayload);
    this.infoPublished = true;
  }

  private async publish(topic: string, payload: string) {
    const client = this.client;
    if (!client) {
      throw new Error("Blynk MQTT client is not connected.");
    }

    await new Promise<void>((resolve, reject) => {
      client.publish(topic, payload, { qos: 0 }, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private waitUntilReady() {
    return this.readyPromise;
  }

  private resetReadyPromise() {
    this.readyPromise = new Promise<void>((resolve) => {
      this.readyResolve = resolve;
    });
  }
}

async function main() {
  loadLocalEnv();

  console.log("Starting demo train telemetry simulator...");
  console.log(`Target Blynk MQTT URL: ${getInitialMqttUrl()}`);
  console.log("The simulator now behaves like a real device session using Blynk Device MQTT API.");
  console.log("CargoGuardian will receive telemetry only if the Blynk device name matches an existing train code.");

  const session = new BlynkDeviceSession();
  await session.start();

  const state = createInitialState(1);
  console.log("Sending telemetry every 5 seconds. Press Ctrl+C to stop.");

  let tick = 0;

  setInterval(async () => {
    tick += 1;
    const overrideState = await readDemoWeightWarningState().catch(() => null);

    updateState(state, 0);
    applyDemoControlState(state, overrideState);

    void session.publishState(state).then(() => {
      console.log(`[${new Date().toISOString()}] Tick ${tick} | demo train published to Blynk MQTT`);
    }).catch((error) => {
      console.log(`[sim] Blynk publish failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }, 5000);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
