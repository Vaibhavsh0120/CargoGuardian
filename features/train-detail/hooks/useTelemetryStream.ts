"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { TelemetryCurrentResponse, TelemetryStreamEvent } from "@/types/telemetry";

export type TelemetryStreamMode = "idle" | "live" | "polling";

const STREAM_REFRESH_INTERVAL_MS = 15_000;

export function useTelemetryStream(trainId: string) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<TelemetryStreamMode>(trainId ? "live" : "idle");
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  useEffect(() => {
    if (!trainId) {
      return;
    }

    let eventSource: EventSource | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;

    const applyStreamEvent = (event: TelemetryStreamEvent) => {
      setMode("live");
      setLastEventAt(event.sentAt);
      queryClient.setQueryData<TelemetryCurrentResponse>(["telemetry", "current", trainId], {
        telemetry: event.snapshot,
        fetchedAt: event.sentAt
      });
      void queryClient.invalidateQueries({
        queryKey: ["telemetry", "history", trainId]
      });
    };

    const startFallbackPolling = () => {
      setMode("polling");
      void queryClient.invalidateQueries({
        queryKey: ["telemetry", "current", trainId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["telemetry", "history", trainId]
      });
    };

    const ensureFallbackPolling = () => {
      if (fallbackTimer) {
        return;
      }

      startFallbackPolling();
      fallbackTimer = setInterval(() => {
        startFallbackPolling();
      }, STREAM_REFRESH_INTERVAL_MS);
    };

    try {
      eventSource = new EventSource(`/api/telemetry/stream/${trainId}`);
      eventSource.onmessage = (message) => {
        const data = JSON.parse(message.data) as TelemetryStreamEvent;
        applyStreamEvent(data);
      };
      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
        ensureFallbackPolling();
      };
    } catch {
      ensureFallbackPolling();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }

      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
    };
  }, [queryClient, trainId]);

  return {
    mode: trainId ? mode : "idle",
    lastEventAt: trainId ? lastEventAt : null
  };
}
