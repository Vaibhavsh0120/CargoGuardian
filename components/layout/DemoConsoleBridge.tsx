"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    cgDemo?: {
      setWeightWarningState: (state: -1 | 0 | 1) => Promise<{ weightWarningState: -1 | 0 | 1 }>;
      help: () => void;
    };
  }
}

export function DemoConsoleBridge() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
      return;
    }

    window.cgDemo = {
      setWeightWarningState: async (state) => {
        if (state !== -1 && state !== 0 && state !== 1) {
          throw new Error("Use -1 for underweight, 0 for safe, or 1 for overweight.");
        }

        const response = await fetch("/api/demo/control", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ weightWarningState: state })
        });

        const data = (await response.json().catch(() => null)) as
          | { error?: string; weightWarningState?: -1 | 0 | 1 }
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Could not update demo simulator state.");
        }

        console.info(`[CargoGuardian demo] weightWarningState set to ${data?.weightWarningState ?? state}`);
        return { weightWarningState: data?.weightWarningState ?? state };
      },
      help: () => {
        console.info("Use window.cgDemo.setWeightWarningState(-1 | 0 | 1)");
      }
    };

    console.info("CargoGuardian demo console ready. Use window.cgDemo.setWeightWarningState(-1 | 0 | 1)");

    return () => {
      delete window.cgDemo;
    };
  }, []);

  return null;
}
