import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { logger } from "@/lib/logger";
import type { CreateTrainPayload } from "@/lib/validation/trains";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type { Train } from "@/types/train";

function trainIdFromCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export async function createTrain(input: CreateTrainPayload, ownerId: string): Promise<Train> {
  const db = getFirebaseAdminDb();
  const docId = trainIdFromCode(input.code);
  const ref = db.collection("trains").doc(docId);

  const existing = await ref.get();
  if (existing.exists) {
    throw new TrainAlreadyExistsError(input.code);
  }

  const now = FieldValue.serverTimestamp();
  const data = {
    code: input.code.toUpperCase(),
    label: input.label.trim(),
    status: "idle" as const,
    cargoType: input.cargoType,
    carCount: input.carCount,
    maxSpeed: input.maxSpeed ?? null,
    origin: input.origin ?? null,
    destination: input.destination ?? null,
    routeId: input.routeId ?? null,
    routeName: null,
    description: input.description ?? null,
    ownerId,
    createdAt: now,
    updatedAt: now
  };

  await ref.set(data);
  logger.info(`Train created: ${docId} (${input.code})`);

  const createdAt = new Date().toISOString();

  return {
    id: docId,
    ...data,
    status: "idle",
    createdAt,
    updatedAt: createdAt
  };
}

export class TrainAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`A train with code "${code}" already exists.`);
    this.name = "TrainAlreadyExistsError";
  }
}
