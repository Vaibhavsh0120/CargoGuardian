"use client";

import { useContext } from "react";

import { TrainContext } from "@/components/layout/TrainContextProvider";

export function useTrainContext() {
  const context = useContext(TrainContext);

  if (!context) {
    throw new Error("useTrainContext must be used within TrainContextProvider.");
  }

  return context;
}
