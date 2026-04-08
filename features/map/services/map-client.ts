import type { MapWorkspaceResponse } from "@/types/map";
import type { Route, UpsertTrainRouteInput } from "@/types/route";
import type { RailwayStationSearchResponse } from "@/types/station";

export async function fetchMapWorkspace() {
  const response = await fetch("/api/map", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load map workspace.");
  }

  return response.json() as Promise<MapWorkspaceResponse>;
}

export async function updateTrainRouteRequest(trainId: string, input: UpsertTrainRouteInput) {
  const response = await fetch(`/api/trains/${encodeURIComponent(trainId)}/route`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to save route.");
  }

  return response.json() as Promise<Route>;
}

export async function searchRailwayStationsRequest(query: string, limit = 8) {
  const response = await fetch(
    `/api/stations/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(String(limit))}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to search railway stations.");
  }

  return response.json() as Promise<RailwayStationSearchResponse>;
}
