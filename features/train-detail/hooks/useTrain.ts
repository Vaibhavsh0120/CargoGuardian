"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchTrain } from "@/features/train-detail/services/train-client";

export function useTrain(trainId: string) {
  const query = useQuery({
    queryKey: ["trains", trainId],
    queryFn: () => fetchTrain(trainId),
    staleTime: 30_000,
    enabled: Boolean(trainId)
  });

  return {
    train: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
