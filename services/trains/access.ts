import "server-only";

import type { Firestore } from "firebase-admin/firestore";

import type { AppUser } from "@/types/user";
import {
  CLEARANCE_STATUS_VALUES,
  JOURNEY_STAGE_VALUES,
  WEIGHT_STATUS_VALUES,
  type ClearanceStatus,
  type JourneyStage,
  type WeightStatus
} from "@/types/train";

type RawRecord = Record<string, unknown>;

export function normalizeClearanceStatus(value: unknown): ClearanceStatus {
  return CLEARANCE_STATUS_VALUES.includes(value as ClearanceStatus) ? (value as ClearanceStatus) : "pending";
}

export function normalizeJourneyStage(value: unknown): JourneyStage {
  return JOURNEY_STAGE_VALUES.includes(value as JourneyStage) ? (value as JourneyStage) : "inspection";
}

export function normalizeWeightStatus(value: unknown): WeightStatus {
  return WEIGHT_STATUS_VALUES.includes(value as WeightStatus) ? (value as WeightStatus) : "unknown";
}

export function canWorkerViewTrain(rawTrain: RawRecord): boolean {
  const clearanceStatus = normalizeClearanceStatus(rawTrain.clearanceStatus);
  const journeyStage = normalizeJourneyStage(rawTrain.journeyStage);

  return clearanceStatus !== "granted" && journeyStage !== "cleared" && journeyStage !== "in-transit";
}

export async function listActiveAssignedTrainIds(db: Firestore, userId: string): Promise<string[]> {
  const snapshot = await db.collection("trainAssignments").where("userId", "==", userId).get();

  return snapshot.docs
    .filter((doc) => !doc.data().revokedAt)
    .map((doc) => doc.data().trainId as string);
}

export async function userHasActiveTrainAssignment(db: Firestore, trainId: string, userId: string): Promise<boolean> {
  const snapshot = await db
    .collection("trainAssignments")
    .where("trainId", "==", trainId)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.some((doc) => !doc.data().revokedAt);
}

export async function canUserManageTrain(
  db: Firestore,
  user: AppUser,
  trainId: string,
  trainOwnerId: string | null
): Promise<boolean> {
  if (user.role === "admin") {
    return true;
  }

  if (user.role !== "master") {
    return false;
  }

  if (trainOwnerId === user.uid) {
    return true;
  }

  return userHasActiveTrainAssignment(db, trainId, user.uid);
}

export async function canUserReviewAccessRequest(
  db: Firestore,
  user: AppUser,
  requestData: RawRecord
): Promise<boolean> {
  if (user.role === "admin") {
    return true;
  }

  if (user.role !== "master") {
    return false;
  }

  if (requestData.role !== "worker") {
    return false;
  }

  const trainId = typeof requestData.trainId === "string" ? requestData.trainId : null;
  if (!trainId) {
    return false;
  }

  const trainDoc = await db.collection("trains").doc(trainId).get();
  if (!trainDoc.exists) {
    return false;
  }

  const trainData = trainDoc.data() as RawRecord | undefined;
  if (!trainData) {
    return false;
  }

  const ownerId = typeof trainData.ownerId === "string" ? trainData.ownerId : null;

  return canUserManageTrain(db, user, trainId, ownerId);
}
