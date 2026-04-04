import type { CreateTrainInput, Train } from "@/types/train";

export async function createTrainRequest(input: CreateTrainInput): Promise<Train> {
  const response = await fetch("/api/trains", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Failed to create train.");
  }

  return response.json() as Promise<Train>;
}
