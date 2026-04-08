"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";

import {
  createFleetQueryKey,
  DEFAULT_FLEET_LIST_PARAMS,
  fetchFleetList,
  type FleetListParams
} from "@/features/fleet/services/fleet-client";
import type { TrainStatus } from "@/types/train";

export function useFleet() {
  const [statusFilter, setStatusFilter] = useState<TrainStatus | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("label");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const deferredSearch = useDeferredValue(search);

  const params: FleetListParams = {
    status: statusFilter,
    search: deferredSearch || undefined,
    sortBy: sortBy || DEFAULT_FLEET_LIST_PARAMS.sortBy,
    sortDir: sortDir || DEFAULT_FLEET_LIST_PARAMS.sortDir
  };

  const query = useQuery({
    queryKey: createFleetQueryKey(params),
    queryFn: () => fetchFleetList(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData
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
