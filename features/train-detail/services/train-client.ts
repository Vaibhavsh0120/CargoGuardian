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

export class TrainNotFoundError extends Error {
  constructor(trainId: string) {
    super(`Train "${trainId}" was not found.`);
    this.name = "TrainNotFoundError";
  }
}
