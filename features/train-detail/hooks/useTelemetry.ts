"use client";

import { useQuery } from "@tanstack/react-query";

import type { TelemetryCurrentResponse } from "@/types/telemetry";

async function fetchTelemetry(trainId: string): Promise<TelemetryCurrentResponse> {
  const response = await fetch(`/api/telemetry/current/${trainId}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load current telemetry.");
  }

  return response.json() as Promise<TelemetryCurrentResponse>;
}

export function useTelemetry(trainId: string) {
  const query = useQuery({
    queryKey: ["telemetry", "current", trainId],
    queryFn: () => fetchTelemetry(trainId),
    enabled: Boolean(trainId),
    staleTime: 15_000
  });

  return {
    telemetry: query.data?.telemetry ?? null,
    fetchedAt: query.data?.fetchedAt ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
