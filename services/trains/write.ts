import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { logger } from "@/lib/logger";
import type { CreateTrainPayload } from "@/lib/validation/trains";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type { Train } from "@/types/train";
import type { AppUser } from "@/types/user";

type TrainDeleteSummary = {
  trainId: string;
  trainCode: string;
  trainLabel: string;
};

type RawTrainRecord = Record<string, unknown>;

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function trainIdFromCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function assertCanDeleteTrain(user?: AppUser) {
  if (!user || user.role !== "admin") {
    throw new TrainDeletePermissionError();
  }
}

async function deleteDocumentsByTrainId(collectionName: string, trainId: string) {
  const db = getFirebaseAdminDb();
  let deletedCount = 0;

  while (true) {
    const snapshot = await db.collection(collectionName).where("trainId", "==", trainId).limit(200).get();

    if (snapshot.empty) {
      return deletedCount;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    deletedCount += snapshot.size;

    if (snapshot.size < 200) {
      return deletedCount;
    }
  }
}

async function deleteDocumentById(collectionName: string, documentId: string) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(collectionName).doc(documentId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return 0;
  }

  await ref.delete();
  return 1;
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
    clearanceStatus: "pending" as const,
    clearanceGrantedAt: null,
    clearanceGrantedBy: null,
    clearanceMethod: null,
    journeyStage: "inspection" as const,
    weightStatus: "unknown" as const,
    cargoType: input.cargoType,
    carCount: input.carCount,
    maxSpeed: input.maxSpeed ?? null,
    origin: input.origin ?? null,
    destination: input.destination ?? null,
    routeId: input.routeId ?? null,
    routeName: null,
    description: input.description ?? null,
    ownerId,
    blynkProvisioningStatus: "provisioned" as const,
    blynkProvisioningError: null,
    blynkTemplateId: process.env.BLYNK_TEMPLATE_ID ?? null,
    blynkTemplateName: process.env.BLYNK_TEMPLATE_NAME ?? null,
    blynkAuthToken: input.blynkAuthToken.trim(),
    blynkDeviceId: input.blynkDeviceId ?? null,
    firmware: null,
    lastSeen: null,
    createdAt: now,
    updatedAt: now
  };

  await ref.set(data);
  logger.info(`Train created: ${docId} (${input.code}) linked to Blynk device ${input.blynkDeviceId ?? "manual-name-match"}`);

  const createdAt = new Date().toISOString();

  return {
    id: docId,
    ...data,
    status: "idle",
    clearanceStatus: "pending",
    clearanceGrantedAt: null,
    clearanceGrantedBy: null,
    clearanceMethod: null,
    journeyStage: "inspection",
    weightStatus: "unknown",
    createdAt,
    updatedAt: createdAt
  };
}

export async function deleteTrain(
  trainId: string,
  user?: AppUser
): Promise<TrainDeleteSummary> {
  assertCanDeleteTrain(user);

  const db = getFirebaseAdminDb();
  const trainRef = db.collection("trains").doc(trainId);
  const trainSnapshot = await trainRef.get();

  if (!trainSnapshot.exists) {
    throw new TrainDeleteNotFoundError(trainId);
  }

  const rawTrain = (trainSnapshot.data() ?? {}) as RawTrainRecord;
  const trainCode = getString(rawTrain.code) ?? trainId.toUpperCase();
  const trainLabel = getString(rawTrain.label) ?? trainCode;
  const blynkDeviceId = getString(rawTrain.blynkDeviceId);

  await Promise.all([
    deleteDocumentsByTrainId("accessRequests", trainId),
    deleteDocumentsByTrainId("trainAssignments", trainId),
    deleteDocumentsByTrainId("routes", trainId),
    deleteDocumentsByTrainId("telemetry_history", trainId),
    deleteDocumentsByTrainId("alerts", trainId),
    deleteDocumentsByTrainId("events", trainId),
    deleteDocumentsByTrainId("telemetry_aggregates", trainId),
    deleteDocumentsByTrainId("analyticsInsights", trainId),
    deleteDocumentsByTrainId("auditLogs", trainId),
    deleteDocumentsByTrainId("dashboardSnapshots", trainId)
  ]);

  await Promise.all([
    deleteDocumentById("telemetry_current", trainId),
    deleteDocumentById("telemetry_aggregates", trainId),
    deleteDocumentById("analyticsInsights", trainId),
    deleteDocumentById("routes", trainId)
  ]);

  await trainRef.delete();

  logger.info(
    `Train deleted: ${trainId} (${trainCode}). Blynk cloud device was left untouched; stored device id ${blynkDeviceId ?? "none"}.`
  );

  return {
    trainId,
    trainCode,
    trainLabel
  };
}

export class TrainAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`A train with code "${code}" already exists.`);
    this.name = "TrainAlreadyExistsError";
  }
}

export class TrainDeletePermissionError extends Error {
  constructor() {
    super("Only administrators can delete trains.");
    this.name = "TrainDeletePermissionError";
  }
}

export class TrainDeleteNotFoundError extends Error {
  constructor(trainId: string) {
    super(`Train "${trainId}" was not found.`);
    this.name = "TrainDeleteNotFoundError";
  }
}
