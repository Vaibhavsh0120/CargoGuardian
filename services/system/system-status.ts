import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { hasFirebaseAdminCredentials } from "@/services/firebase/admin";

export type SystemStatusLevel = "healthy" | "degraded" | "offline" | "demo";

export type SystemStatusItem = {
  key: string;
  label: string;
  level: SystemStatusLevel;
  detail: string;
};

export type SystemStatusSummary = {
  overall: SystemStatusLevel;
  items: SystemStatusItem[];
  checkedAt: string;
};

export function getSystemStatusSummary(): SystemStatusSummary {
  const serverEnv = getServerEnv();
  const demoMode = Boolean(serverEnv.DEMO_BLYNK_AUTH_TOKEN);
  const firebaseConfigured = Boolean(serverEnv.FIREBASE_PROJECT_ID);
  const adminReady = hasFirebaseAdminCredentials();

  const items: SystemStatusItem[] = [
    {
      key: "auth",
      label: "Auth",
      level: firebaseConfigured ? "healthy" : "offline",
      detail: firebaseConfigured ? "Session guard ready" : "Firebase not configured"
    },
    {
      key: "data",
      label: "Data",
      level: adminReady ? "healthy" : firebaseConfigured ? "degraded" : "offline",
      detail: adminReady
        ? "Admin-backed reads enabled"
        : firebaseConfigured
          ? "Project detected, admin credentials limited"
          : "No train data source detected"
    },
    {
      key: "mode",
      label: "Mode",
      level: demoMode ? "demo" : "healthy",
      detail: demoMode ? "Demo controls enabled" : "Live integration path"
    }
  ];

  return {
    overall: getOverallLevel(items),
    items,
    checkedAt: new Date().toISOString()
  };
}

function getOverallLevel(items: SystemStatusItem[]): SystemStatusLevel {
  if (items.some((item) => item.level === "offline")) {
    return "offline";
  }

  if (items.some((item) => item.level === "degraded")) {
    return "degraded";
  }

  if (items.some((item) => item.level === "demo")) {
    return "demo";
  }

  return "healthy";
}
