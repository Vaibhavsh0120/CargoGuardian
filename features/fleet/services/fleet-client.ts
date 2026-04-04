import type { TrainListItem, TrainStatus } from "@/types/train";

const API_BASE = "/api/trains";

export type FleetListResponse = {
  trains: TrainListItem[];
  fetchedAt: string;
};

export type FleetListParams = {
  status?: TrainStatus;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  limit?: number;
};

export async function fetchFleetList(params: FleetListParams = {}): Promise<FleetListResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDir) searchParams.set("sortDir", params.sortDir);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const url = `${API_BASE}?${searchParams.toString()}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch fleet list.");
  }

  return response.json() as Promise<FleetListResponse>;
}
