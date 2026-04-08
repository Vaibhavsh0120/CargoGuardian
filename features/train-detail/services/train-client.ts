import type { Route } from "@/types/route";
import type { Train } from "@/types/train";

export async function fetchTrain(trainId: string): Promise<Train> {
  const response = await fetch(`/api/trains/${trainId}`, { cache: "no-store" });

  if (!response.ok) {
    if (response.status === 404) {
      throw new TrainNotFoundError(trainId);
    }
    throw new Error("Failed to fetch train.");
  }

  return response.json() as Promise<Train>;
}

export async function fetchTrainRoute(trainId: string): Promise<Route | null> {
  const response = await fetch(`/api/trains/${trainId}/route`, { cache: "no-store" });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch train route.");
  }

  return response.json() as Promise<Route>;
}

export async function deleteTrainRequest(trainId: string): Promise<{ success: true; trainId: string }> {
  const response = await fetch(`/api/trains/${trainId}`, {
    method: "DELETE"
  });

  const body = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Failed to delete train.");
  }

  return (body ?? { success: true, trainId }) as { success: true; trainId: string };
}

export class TrainNotFoundError extends Error {
  constructor(trainId: string) {
    super(`Train "${trainId}" was not found.`);
    this.name = "TrainNotFoundError";
  }
}
