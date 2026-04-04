"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTrainRequest } from "@/features/trains/services/train-write-client";
import type { CreateTrainInput } from "@/types/train";

export function useCreateTrain() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateTrainInput) => createTrainRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fleet"] });
      void queryClient.invalidateQueries({ queryKey: ["shell", "trains"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return {
    createTrain: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset
  };
}
