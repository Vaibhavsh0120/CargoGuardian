"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { TrainSelectorItem, TrainSelectorResponse, TrainSelectorSource } from "@/types/train";

const TRAIN_STORAGE_KEY = "cg:selected-train-id";

export type TrainContextValue = {
  trains: TrainSelectorItem[];
  selectedTrainId: string | null;
  selectedTrain: TrainSelectorItem | null;
  source: TrainSelectorSource;
  isLoading: boolean;
  isError: boolean;
  setSelectedTrainId: (trainId: string | null) => void;
  refresh: () => Promise<unknown>;
};

export const TrainContext = createContext<TrainContextValue | null>(null);

export function TrainContextProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [preferredTrainId, setPreferredTrainId] = useState<string | null>(() => readSelectedTrainId());
  const trainQuery = useQuery({
    queryKey: ["shell", "trains"],
    queryFn: fetchTrainSelectorItems,
    staleTime: 60_000
  });
  const refresh = trainQuery.refetch;
  const trains = useMemo(() => trainQuery.data?.trains ?? [], [trainQuery.data?.trains]);
  const source = trainQuery.data?.source ?? "empty";
  const selectedTrainId =
    preferredTrainId && trains.some((train) => train.id === preferredTrainId)
      ? preferredTrainId
      : trains[0]?.id ?? null;

  useEffect(() => {
    writeSelectedTrainId(selectedTrainId);
  }, [selectedTrainId]);

  const selectedTrain = trains.find((train) => train.id === selectedTrainId) ?? null;

  const value = useMemo<TrainContextValue>(
    () => ({
      trains,
      selectedTrainId,
      selectedTrain,
      source,
      isLoading: trainQuery.isLoading,
      isError: trainQuery.isError,
      setSelectedTrainId: setPreferredTrainId,
      refresh: () => refresh()
    }),
    [refresh, selectedTrain, selectedTrainId, source, trainQuery.isError, trainQuery.isLoading, trains]
  );

  return <TrainContext.Provider value={value}>{children}</TrainContext.Provider>;
}

async function fetchTrainSelectorItems(): Promise<TrainSelectorResponse> {
  const response = await fetch("/api/trains", {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load train list.");
  }

  return response.json() as Promise<TrainSelectorResponse>;
}

function readSelectedTrainId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TRAIN_STORAGE_KEY);
}

function writeSelectedTrainId(trainId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (trainId) {
    window.localStorage.setItem(TRAIN_STORAGE_KEY, trainId);
    return;
  }

  window.localStorage.removeItem(TRAIN_STORAGE_KEY);
}
