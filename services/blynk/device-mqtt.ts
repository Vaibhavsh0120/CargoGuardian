import "server-only";

import mqtt, { type IClientOptions } from "mqtt";

import { getServerEnv } from "@/lib/env/server";
import { logger } from "@/lib/logger";

const MQTT_INFO_VERSION = "cg-web-demo-1.0.0";
const MQTT_KEEPALIVE_SECONDS = 20;
const MQTT_CONNECT_TIMEOUT_MS = 10_000;
const MQTT_PUBLISH_SETTLE_DELAY_MS = 750;
const MQTT_REDIRECT_GRACE_MS = 350;
const MAX_REDIRECT_HOPS = 2;
const REDIRECT_TOPIC = "downlink/redirect";
const DIAGNOSTIC_TOPIC = "downlink/diag";

function normalizeMqttUrl(rawUrl: string) {
  const url = new URL(rawUrl);

  if ((url.protocol === "ws:" || url.protocol === "wss:") && (!url.pathname || url.pathname === "/")) {
    url.pathname = "/mqtt";
  }

  if (url.protocol === "mqtts:" && !url.port) {
    url.port = "8883";
  }

  if (url.protocol === "wss:" && !url.port) {
    url.port = "443";
  }

  return url.toString();
}

function getCandidateBlynkMqttUrls() {
  const env = getServerEnv();

  if (env.BLYNK_MQTT_URL?.trim()) {
    return [normalizeMqttUrl(env.BLYNK_MQTT_URL.trim())];
  }

  const baseUrl = env.BLYNK_BASE_URL || "https://blynk.cloud";
  const parsed = new URL(baseUrl);

  return [`mqtts://${parsed.hostname}:8883`].map(normalizeMqttUrl);
}

function buildClientOptions(authToken: string): IClientOptions {
  return {
    username: "device",
    password: authToken,
    keepalive: MQTT_KEEPALIVE_SECONDS,
    clean: true,
    reconnectPeriod: 0,
    connectTimeout: MQTT_CONNECT_TIMEOUT_MS,
    clientId: `cg-web-${Math.random().toString(16).slice(2, 10)}`
  };
}

export async function publishBlynkDeviceBatchViaMqtt(authToken: string, payload: Record<string, unknown>) {
  const token = authToken.trim();
  if (!token) {
    throw new Error("Blynk device Auth Token is required for MQTT publish.");
  }

  const mqttUrls = [...new Set(getCandidateBlynkMqttUrls())];
  const errors: string[] = [];

  for (const mqttUrl of mqttUrls) {
    try {
      await publishViaMqttUrl(mqttUrl, token, payload);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${mqttUrl}: ${message}`);
      logger.warn(`Blynk MQTT publish failed via ${mqttUrl}`, message);
    }
  }

  throw new Error(`Blynk MQTT publish failed across all configured endpoints. ${errors.join(" | ")}`);
}

async function publishViaMqttUrl(
  mqttUrl: string,
  authToken: string,
  payload: Record<string, unknown>,
  redirectHop = 0
) {
  await new Promise<void>((resolve, reject) => {
    const client = mqtt.connect(mqttUrl, buildClientOptions(authToken));
    let settled = false;
    let redirectHandled = false;
    let publishScheduled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    let connectTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      fail(new Error(`Timed out connecting to ${mqttUrl}`));
    }, MQTT_CONNECT_TIMEOUT_MS + 1_000);

    const clearTimers = () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
        redirectTimer = null;
      }

      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = null;
      }
    };

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimers();
      callback();
    };

    const fail = (error: Error) => {
      finish(() => {
        client.end(true, {}, () => reject(error));
      });
    };

    const publishBatch = async () => {
      if (publishScheduled || redirectHandled) {
        return;
      }

      publishScheduled = true;

      try {
        await publish(client, "batch_ds", payload);
        await delay(MQTT_PUBLISH_SETTLE_DELAY_MS);

        finish(() => {
          client.end(false, {}, () => resolve());
        });
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    };

    client.on("message", (topic, message) => {
      const text = message.toString().trim();

      if (topic === REDIRECT_TOPIC) {
        if (redirectHop >= MAX_REDIRECT_HOPS || !text || text === mqttUrl || redirectHandled) {
          return;
        }

        redirectHandled = true;
        logger.info(`Blynk MQTT redirect received: ${mqttUrl} -> ${text}`);

        finish(() => {
          client.end(false, {}, () => {
            void publishViaMqttUrl(normalizeMqttUrl(text), authToken, payload, redirectHop + 1).then(resolve).catch(reject);
          });
        });
        return;
      }

      if (topic === DIAGNOSTIC_TOPIC && text) {
        logger.warn(`Blynk MQTT diagnostic from ${mqttUrl}: ${text}`);
      }
    });

    client.once("error", (error) => {
      fail(error instanceof Error ? error : new Error(String(error)));
    });

    client.once("connect", () => {
      void (async () => {
        try {
          logger.info(`Connected to Blynk MQTT broker ${mqttUrl}`);
          await subscribe(client, "downlink/#");
          await publish(client, "info/mcu", {
            tmpl: process.env.BLYNK_TEMPLATE_ID ?? "unknown-template",
            ver: MQTT_INFO_VERSION,
            build: "cargo-guardian-web-demo",
            type: process.env.BLYNK_TEMPLATE_ID ?? "cargo-guardian-web-demo",
            rxbuff: 2048
          });

          redirectTimer = setTimeout(() => {
            void publishBatch();
          }, MQTT_REDIRECT_GRACE_MS);
        } catch (error) {
          fail(error instanceof Error ? error : new Error(String(error)));
        }
      })();
    });
  });
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function publish(client: mqtt.MqttClient, topic: string, payload: Record<string, unknown>) {
  await new Promise<void>((resolve, reject) => {
    client.publish(topic, JSON.stringify(payload), { qos: 0 }, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function subscribe(client: mqtt.MqttClient, topic: string) {
  await new Promise<void>((resolve, reject) => {
    client.subscribe(topic, { qos: 0 }, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
