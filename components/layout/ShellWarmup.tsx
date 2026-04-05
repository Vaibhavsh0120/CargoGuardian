"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/features/auth/hooks/useSession";
import { fetchTrain } from "@/features/train-detail/services/train-client";
import { useTrainContext } from "@/hooks/useTrainContext";
import { desktopNavigationItems, mobileNavigationItems } from "@/lib/constants/routes";
import type { AccessWorkspaceResponse } from "@/types/access";
import type { AlertListResponse } from "@/types/alert";
import type { DashboardOperationsData } from "@/types/dashboard";
import type { HistoryListResponse } from "@/types/event";
import type { TelemetryCurrentResponse, TelemetryHistoryResponse } from "@/types/telemetry";
import type { Train } from "@/types/train";

type DashboardOperationsResponse = DashboardOperationsData & {
  fetchedAt: string;
};

function scheduleIdleTask(callback: () => void) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(callback, { timeout: 1500 });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = globalThis.setTimeout(callback, 250);
  return () => globalThis.clearTimeout(handle);
}

async function fetchDashboardOperations(): Promise<DashboardOperationsResponse> {
  const response = await fetch("/api/dashboard/operations", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load operational dashboard data.");
  }

  return response.json() as Promise<DashboardOperationsResponse>;
}

async function fetchAccessWorkspace(): Promise<AccessWorkspaceResponse> {
  const response = await fetch("/api/trains/access/workspace", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load access workspace.");
  }

  return response.json() as Promise<AccessWorkspaceResponse>;
}

async function fetchAlerts(): Promise<AlertListResponse> {
  const response = await fetch("/api/alerts?status=active&severity=all&limit=100", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load alerts.");
  }

  return response.json() as Promise<AlertListResponse>;
}

async function fetchCurrentTelemetry(trainId: string): Promise<TelemetryCurrentResponse> {
  const response = await fetch(`/api/telemetry/current/${trainId}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load current telemetry.");
  }

  return response.json() as Promise<TelemetryCurrentResponse>;
}

async function fetchTelemetryHistory(trainId: string): Promise<TelemetryHistoryResponse> {
  const response = await fetch(`/api/telemetry/history?trainId=${encodeURIComponent(trainId)}&limit=24`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load telemetry history.");
  }

  return response.json() as Promise<TelemetryHistoryResponse>;
}

async function fetchTrainAlerts(trainId: string): Promise<AlertListResponse> {
  const response = await fetch(`/api/alerts?trainId=${encodeURIComponent(trainId)}&status=all&limit=8`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load train alerts.");
  }

  return response.json() as Promise<AlertListResponse>;
}

async function fetchTrainHistory(trainId: string): Promise<HistoryListResponse> {
  const response = await fetch(`/api/history?trainId=${encodeURIComponent(trainId)}&limit=8`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load train history.");
  }

  return response.json() as Promise<HistoryListResponse>;
}

export function ShellWarmup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionQuery = useSession();
  const { selectedTrainId } = useTrainContext();

  useEffect(() => {
    return scheduleIdleTask(() => {
      const routes = new Set([
        ...desktopNavigationItems.map((item) => item.href),
        ...mobileNavigationItems.map((item) => item.href)
      ]);

      routes.forEach((route) => {
        router.prefetch(route);
      });
    });
  }, [router]);

  useEffect(() => {
    const user = sessionQuery.data?.user;
    if (!user) {
      return;
    }

    return scheduleIdleTask(() => {
      void queryClient.prefetchQuery({
        queryKey: ["dashboard", "operations"],
        queryFn: fetchDashboardOperations,
        staleTime: 15_000
      });

      void queryClient.prefetchQuery({
        queryKey: ["access", "workspace"],
        queryFn: fetchAccessWorkspace,
        staleTime: 15_000
      });

      void queryClient.prefetchQuery({
        queryKey: ["alerts", "active", "all"],
        queryFn: fetchAlerts,
        staleTime: 15_000
      });

      if (user.role === "admin") {
        router.prefetch("/trains/new");
      }
    });
  }, [queryClient, router, sessionQuery.data?.user]);

  useEffect(() => {
    if (!selectedTrainId) {
      return;
    }

    return scheduleIdleTask(() => {
      router.prefetch(`/fleet/${selectedTrainId}`);

      void queryClient.prefetchQuery({
        queryKey: ["trains", selectedTrainId],
        queryFn: () => fetchTrain(selectedTrainId) as Promise<Train>,
        staleTime: 30_000
      });
      void queryClient.prefetchQuery({
        queryKey: ["telemetry", "current", selectedTrainId],
        queryFn: () => fetchCurrentTelemetry(selectedTrainId),
        staleTime: 15_000
      });
      void queryClient.prefetchQuery({
        queryKey: ["telemetry", "history", selectedTrainId],
        queryFn: () => fetchTelemetryHistory(selectedTrainId),
        staleTime: 15_000
      });
      void queryClient.prefetchQuery({
        queryKey: ["alerts", "train", selectedTrainId],
        queryFn: () => fetchTrainAlerts(selectedTrainId),
        staleTime: 15_000
      });
      void queryClient.prefetchQuery({
        queryKey: ["history", "train", selectedTrainId],
        queryFn: () => fetchTrainHistory(selectedTrainId),
        staleTime: 15_000
      });
    });
  }, [queryClient, router, selectedTrainId]);

  return null;
}
