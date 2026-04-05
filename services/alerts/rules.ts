import "server-only";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { activateAlert, resolveAlertByRule } from "@/services/alerts/write";
import { deriveTelemetryFreshness, getNumber, getOptionalIsoString } from "@/services/telemetry/derive";
import { applyBlynkConnectionToFreshness, getBlynkConnectionOverrides } from "@/services/telemetry/live-status";
import type { TelemetryFreshnessState } from "@/types/telemetry";
import type { Train } from "@/types/train";

type ApplyTelemetryAlertRulesInput = {
  train: Pick<Train, "id" | "code" | "label" | "journeyStage" | "weightStatus">;
  weightWarningState: -1 | 0 | 1;
  weightKg: number | null;
  gpsLat: number | null;
  gpsLng: number | null;
  telemetryReportedAt: string;
  previousWeightKg: number | null;
};

type RawRecord = Record<string, unknown>;

const TRANSIT_WEIGHT_CHANGE_MIN_KG = 750;
const TRANSIT_WEIGHT_CHANGE_MIN_RATIO = 0.05;

function isTransitWeightChangeIncident(previousWeightKg: number | null, nextWeightKg: number | null) {
  if (previousWeightKg === null || nextWeightKg === null || previousWeightKg <= 0) {
    return false;
  }

  const delta = Math.abs(nextWeightKg - previousWeightKg);
  return delta >= TRANSIT_WEIGHT_CHANGE_MIN_KG && delta / previousWeightKg >= TRANSIT_WEIGHT_CHANGE_MIN_RATIO;
}

function buildFreshnessDescription(train: Train, freshnessState: TelemetryFreshnessState, ageSeconds: number | null) {
  if (freshnessState === "offline") {
    return ageSeconds === null
      ? `${train.label} has no recent telemetry and should be treated as offline.`
      : `${train.label} has not reported for ${ageSeconds}s and should be treated as offline.`;
  }

  return ageSeconds === null
    ? `${train.label} telemetry is stale and requires attention.`
    : `${train.label} telemetry is stale after ${ageSeconds}s without an update.`;
}

export async function applyTelemetryAlertRules(input: ApplyTelemetryAlertRulesInput) {
  const alertTasks: Promise<unknown>[] = [];

  if (input.weightWarningState === 1) {
    alertTasks.push(
      activateAlert({
        trainId: input.train.id,
        trainCode: input.train.code,
        trainLabel: input.train.label,
        type: "overweight",
        severity: "high",
        title: "Overweight cargo warning",
        description: `${input.train.label} reported an overweight condition from hardware telemetry.`,
        journeyStage: input.train.journeyStage,
        weightStatus: "overweight",
        weightKg: input.weightKg,
        gpsLat: input.gpsLat,
        gpsLng: input.gpsLng,
        telemetryReportedAt: input.telemetryReportedAt,
        details: {
          weightWarningState: input.weightWarningState
        }
      })
    );
  } else {
    alertTasks.push(
      resolveAlertByRule({
        trainId: input.train.id,
        trainCode: input.train.code,
        trainLabel: input.train.label,
        type: "overweight",
        resolutionNote: "Hardware telemetry returned to a non-overweight state."
      })
    );
  }

  if (input.weightWarningState === -1) {
    alertTasks.push(
      activateAlert({
        trainId: input.train.id,
        trainCode: input.train.code,
        trainLabel: input.train.label,
        type: "underweight",
        severity: "medium",
        title: "Underweight cargo warning",
        description: `${input.train.label} reported an underweight condition from hardware telemetry.`,
        journeyStage: input.train.journeyStage,
        weightStatus: "underweight",
        weightKg: input.weightKg,
        gpsLat: input.gpsLat,
        gpsLng: input.gpsLng,
        telemetryReportedAt: input.telemetryReportedAt,
        details: {
          weightWarningState: input.weightWarningState
        }
      })
    );
  } else {
    alertTasks.push(
      resolveAlertByRule({
        trainId: input.train.id,
        trainCode: input.train.code,
        trainLabel: input.train.label,
        type: "underweight",
        resolutionNote: "Hardware telemetry returned to a non-underweight state."
      })
    );
  }

  if (input.train.journeyStage === "in-transit" && isTransitWeightChangeIncident(input.previousWeightKg, input.weightKg)) {
    const deltaKg = input.previousWeightKg === null || input.weightKg === null ? null : Math.abs(input.weightKg - input.previousWeightKg);
    alertTasks.push(
      activateAlert({
        trainId: input.train.id,
        trainCode: input.train.code,
        trainLabel: input.train.label,
        type: "transit-weight-change",
        severity: "critical",
        title: "In-transit weight change incident",
        description: `${input.train.label} changed weight significantly during transit and should be treated as a cargo incident.`,
        journeyStage: "incident",
        weightStatus: input.train.weightStatus,
        weightKg: input.weightKg,
        gpsLat: input.gpsLat,
        gpsLng: input.gpsLng,
        telemetryReportedAt: input.telemetryReportedAt,
        details: {
          previousWeightKg: input.previousWeightKg,
          deltaKg,
          thresholdKg: TRANSIT_WEIGHT_CHANGE_MIN_KG,
          thresholdRatio: TRANSIT_WEIGHT_CHANGE_MIN_RATIO
        }
      })
    );
  } else {
    alertTasks.push(
      resolveAlertByRule({
        trainId: input.train.id,
        trainCode: input.train.code,
        trainLabel: input.train.label,
        type: "transit-weight-change",
        resolutionNote: "No significant in-transit weight delta is currently detected."
      })
    );
  }

  await Promise.all(alertTasks);
}

export async function syncFreshnessAlertsForTrains(trains: Train[]) {
  if (!process.env.FIREBASE_PROJECT_ID || !trains.length) {
    return;
  }

  const db = getFirebaseAdminDb();
  const telemetryDocs = await db.getAll(...trains.map((train) => db.collection("telemetry_current").doc(train.id)));
  const connectionOverrides = await getBlynkConnectionOverrides(trains);

  await Promise.all(
    trains.map(async (train, index) => {
      const rawTelemetry = (telemetryDocs[index]?.exists ? (telemetryDocs[index].data() as RawRecord) : null) ?? null;
      const reportedAt = getOptionalIsoString(rawTelemetry?.createdAt) ?? train.lastSeen;
      const freshness = applyBlynkConnectionToFreshness(
        deriveTelemetryFreshness(reportedAt),
        connectionOverrides.get(train.id) ?? null
      );

      if (freshness.state === "fresh") {
        await resolveAlertByRule({
          trainId: train.id,
          trainCode: train.code,
          trainLabel: train.label,
          type: "offline",
          resolutionNote: "Telemetry freshness recovered."
        });
        return;
      }

      await activateAlert({
        trainId: train.id,
        trainCode: train.code,
        trainLabel: train.label,
        type: "offline",
        severity: freshness.state === "offline" ? "high" : "medium",
        title: freshness.state === "offline" ? "Hardware offline" : "Telemetry stale",
        description: buildFreshnessDescription(train, freshness.state, freshness.ageSeconds),
        journeyStage: freshness.state === "offline" ? "offline" : train.journeyStage,
        weightStatus: train.weightStatus,
        weightKg: getNumber(rawTelemetry?.weightKg),
        gpsLat: getNumber(rawTelemetry?.gpsLat),
        gpsLng: getNumber(rawTelemetry?.gpsLng),
        telemetryReportedAt: reportedAt,
        details: {
          freshnessState: freshness.state,
          ageSeconds: freshness.ageSeconds
        }
      });
    })
  );
}
