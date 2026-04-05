"use client";

import { useQuery } from "@tanstack/react-query";

import type { TelemetryHistoryResponse } from "@/types/telemetry";

async function fetchTelemetryHistory(trainId: string): Promise<TelemetryHistoryResponse> {
  const response = await fetch(`/api/telemetry/history?trainId=${encodeURIComponent(trainId)}&limit=24`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load telemetry history.");
  }

  return response.json() as Promise<TelemetryHistoryResponse>;
}

export function useTelemetryHistory(trainId: string) {
  const query = useQuery({
    queryKey: ["telemetry", "history", trainId],
    queryFn: () => fetchTelemetryHistory(trainId),
    enabled: Boolean(trainId),
    staleTime: 15_000
  });

  return {
    history: query.data?.history ?? [],
    fetchedAt: query.data?.fetchedAt ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
