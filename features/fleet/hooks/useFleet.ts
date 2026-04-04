"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchFleetList, type FleetListParams } from "@/features/fleet/services/fleet-client";
import type { TrainStatus } from "@/types/train";

export function useFleet() {
  const [statusFilter, setStatusFilter] = useState<TrainStatus | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("label");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const params: FleetListParams = {
    status: statusFilter,
    search: search || undefined,
    sortBy,
    sortDir
  };

  const query = useQuery({
    queryKey: ["fleet", "trains", params],
    queryFn: () => fetchFleetList(params),
    staleTime: 30_000
  });

  return {
    trains: query.data?.trains ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    fetchedAt: query.data?.fetchedAt ?? null,

    // Filters
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir
  };
}
