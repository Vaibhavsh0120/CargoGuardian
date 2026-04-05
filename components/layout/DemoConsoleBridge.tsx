"use client";

import { useEffect, useRef, useState } from "react";

type DemoCommand = "start" | "stop" | -1 | 0 | 1;
type DemoRuntimeStatus = "stopped" | "running";

type DemoControlResponse = {
  runtimeStatus?: DemoRuntimeStatus;
  weightWarningState?: -1 | 0 | 1;
  message?: string;
  updatedAt?: string | null;
  lastTickAt?: string | null;
};

declare global {
  interface Window {
    cgDemo?: DemoConsoleApi;
    demo?: DemoConsoleApi;
  }
}

type DemoConsoleApi = ((command: DemoCommand) => Promise<DemoControlResponse>) & {
  run: (command: DemoCommand) => Promise<DemoControlResponse>;
  start: () => Promise<DemoControlResponse>;
  stop: () => Promise<DemoControlResponse>;
  safe: () => Promise<DemoControlResponse>;
  underweight: () => Promise<DemoControlResponse>;
  overweight: () => Promise<DemoControlResponse>;
  setWeightWarningState: (state: -1 | 0 | 1) => Promise<DemoControlResponse>;
  status: () => Promise<DemoControlResponse>;
  help: () => void;
};

const DEMO_TICK_INTERVAL_MS = 5000;

export function DemoConsoleBridge() {
  const [isRunning, setIsRunning] = useState(false);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const globalAliases = new Map<string, PropertyDescriptor | undefined>();

    const registerConsoleGetter = (name: string, action: () => void, message: string) => {
      globalAliases.set(name, Object.getOwnPropertyDescriptor(window, name));
      Object.defineProperty(window, name, {
        configurable: true,
        get() {
          action();
          return message;
        }
      });
    };

    const runCommand = async (command: DemoCommand): Promise<DemoControlResponse> => {
      if (command === "start" || command === "stop") {
        const response = await fetch("/api/demo/control", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ command })
        });

        const data = (await response.json().catch(() => null)) as DemoControlResponse | { error?: string } | null;

        if (!response.ok) {
          throw new Error((data as { error?: string } | null)?.error ?? `Could not ${command} demo publishing.`);
        }

        setIsRunning(command === "start");
        console.info(`[CargoGuardian demo] ${command}`);
        return data as DemoControlResponse;
      }

      const response = await fetch("/api/demo/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ weightWarningState: command })
      });

      const data = (await response.json().catch(() => null)) as DemoControlResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error((data as { error?: string } | null)?.error ?? "Could not update demo simulator state.");
      }

      console.info(`[CargoGuardian demo] weightWarningState set to ${command}`);
      return data as DemoControlResponse;
    };

    const fetchStatus = async (): Promise<DemoControlResponse> => {
      const response = await fetch("/api/demo/control", {
        method: "GET",
        cache: "no-store"
      });

      const data = (await response.json().catch(() => null)) as DemoControlResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error((data as { error?: string } | null)?.error ?? "Could not load demo status.");
      }

      return data as DemoControlResponse;
    };

    const demoApi = Object.assign(runCommand, {
      run: runCommand,
      start: () => runCommand("start"),
      stop: () => runCommand("stop"),
      safe: () => runCommand(0),
      underweight: () => runCommand(-1),
      overweight: () => runCommand(1),
      setWeightWarningState: (state: -1 | 0 | 1) => runCommand(state),
      status: fetchStatus,
      help: () => {
        console.info('Use window.demo("start"), window.demo.start(), window.demo.stop(), or window.demo(-1 | 0 | 1)');
      }
    }) as DemoConsoleApi;

    window.cgDemo = demoApi;
    window.demo = demoApi;
    registerConsoleGetter("start", () => void demoApi.start(), "[CargoGuardian demo] start requested");
    registerConsoleGetter("stop", () => void demoApi.stop(), "[CargoGuardian demo] stop requested");
    registerConsoleGetter("safe", () => void demoApi.safe(), "[CargoGuardian demo] safe mode requested");
    registerConsoleGetter("under", () => void demoApi.underweight(), "[CargoGuardian demo] underweight mode requested");
    registerConsoleGetter("over", () => void demoApi.overweight(), "[CargoGuardian demo] overweight mode requested");
    registerConsoleGetter("status", () => void demoApi.status(), "[CargoGuardian demo] status requested");

    console.info(
      'CargoGuardian demo console ready. Type start, stop, safe, under, over, or status'
    );

    return () => {
      delete window.cgDemo;
      delete window.demo;
      for (const [name, descriptor] of globalAliases.entries()) {
        if (descriptor) {
          Object.defineProperty(window, name, descriptor);
        } else {
          Reflect.deleteProperty(window, name);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    const publishTick = async () => {
      const response = await fetch("/api/demo/tick", {
        method: "POST",
        cache: "no-store"
      });

      const data = (await response.json().catch(() => null)) as
        | {
            runtimeStatus?: DemoRuntimeStatus;
            published?: boolean;
            error?: string;
            state?: {
              weightKg?: number;
              gpsLat?: number;
              gpsLng?: number;
              signalStrength?: number;
            };
          }
        | null;

      if (!response.ok) {
        console.warn(`[CargoGuardian demo] tick failed: ${data?.error ?? "unknown error"}`);
        return;
      }

      if (data?.runtimeStatus === "stopped") {
        setIsRunning(false);
        console.info("[CargoGuardian demo] tick loop stopped");
        return;
      }

      if (data?.published) {
        const state = data.state;
        console.info(
          `[CargoGuardian demo] sent to Blynk | weight=${state?.weightKg ?? "n/a"}kg | lat=${state?.gpsLat ?? "n/a"} | lng=${state?.gpsLng ?? "n/a"} | signal=${state?.signalStrength ?? "n/a"}`
        );
      }
    };

    void publishTick();
    tickIntervalRef.current = setInterval(() => {
      void publishTick();
    }, DEMO_TICK_INTERVAL_MS);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    const handlePageHide = () => {
      if (!isRunning) {
        return;
      }

      void fetch("/api/demo/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ command: "stop" }),
        keepalive: true
      });
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isRunning]);

  return null;
}
