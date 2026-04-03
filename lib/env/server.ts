import { z } from "zod";

const serverEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  BLYNK_BASE_URL: z.string().url().optional(),
  BLYNK_AUTH_TOKEN: z.string().optional(),
  BLYNK_WEBHOOK_SECRET: z.string().optional(),
  TIGERGRAPH_BASE_URL: z.string().optional(),
  TIGERGRAPH_GRAPH_NAME: z.string().optional(),
  TIGERGRAPH_USERNAME: z.string().optional(),
  TIGERGRAPH_PASSWORD: z.string().optional(),
  TIGERGRAPH_API_KEY: z.string().optional(),
  MAPBOX_SECRET_TOKEN: z.string().optional(),
  SESSION_COOKIE_SECRET: z.string().optional(),
  LOG_LEVEL: z.string().default("info")
});

export function getServerEnv() {
  const env = serverEnvSchema.parse({
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    BLYNK_BASE_URL: process.env.BLYNK_BASE_URL,
    BLYNK_AUTH_TOKEN: process.env.BLYNK_AUTH_TOKEN,
    BLYNK_WEBHOOK_SECRET: process.env.BLYNK_WEBHOOK_SECRET,
    TIGERGRAPH_BASE_URL: process.env.TIGERGRAPH_BASE_URL,
    TIGERGRAPH_GRAPH_NAME: process.env.TIGERGRAPH_GRAPH_NAME,
    TIGERGRAPH_USERNAME: process.env.TIGERGRAPH_USERNAME,
    TIGERGRAPH_PASSWORD: process.env.TIGERGRAPH_PASSWORD,
    TIGERGRAPH_API_KEY: process.env.TIGERGRAPH_API_KEY,
    MAPBOX_SECRET_TOKEN: process.env.MAPBOX_SECRET_TOKEN,
    SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL
  });

  return {
    ...env,
    FIREBASE_PRIVATE_KEY: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  };
}
