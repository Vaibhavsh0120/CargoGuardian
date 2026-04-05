import "server-only";

import { listAccessRequestsForUser } from "@/services/access/read";
import { listAlerts } from "@/services/alerts/read";
import { listOperationalEvents } from "@/services/history/read";
import { listCurrentTelemetry } from "@/services/telemetry/read";
import { listAccessibleTrains } from "@/services/trains/read";
import type {
  DashboardClearanceQueueItem,
  DashboardOperationsData,
  DashboardVisibleTrainItem
} from "@/types/dashboard";
import type { TelemetrySnapshot } from "@/types/telemetry";
import type { Train } from "@/types/train";
import type { AppUser } from "@/types/user";

type DashboardOperationsResponse = DashboardOperationsData & {
  fetchedAt: string;
};

function buildClearanceQueue(
  trains: Train[],
  telemetryByTrainId: Map<string, TelemetrySnapshot>
): DashboardClearanceQueueItem[] {
  return trains
    .filter((train) => train.clearanceStatus === "pending")
    .map((train) => {
      const telemetry = telemetryByTrainId.get(train.id);
      return {
        id: train.id,
        code: train.code,
        label: train.label,
        journeyStage: train.journeyStage,
        clearanceStatus: train.clearanceStatus,
        routeName: train.routeName,
        weightStatus: train.weightStatus,
        freshnessState: telemetry?.freshnessState ?? "offline",
        reportedAt: telemetry?.reportedAt ?? train.lastSeen
      };
    })
    .sort((left, right) => {
      const leftTime = left.reportedAt ? new Date(left.reportedAt).getTime() : 0;
      const rightTime = right.reportedAt ? new Date(right.reportedAt).getTime() : 0;
      return rightTime - leftTime;
    });
}

function buildVisibleTrains(
  trains: Train[],
  telemetryByTrainId: Map<string, TelemetrySnapshot>
): DashboardVisibleTrainItem[] {
  return trains.slice(0, 8).map((train) => {
    const telemetry = telemetryByTrainId.get(train.id);

    return {
      id: train.id,
      code: train.code,
      label: train.label,
      status: train.status,
      journeyStage: train.journeyStage,
      clearanceStatus: train.clearanceStatus,
      routeName: train.routeName,
      freshnessState: telemetry?.freshnessState ?? "offline",
      reportedAt: telemetry?.reportedAt ?? train.lastSeen
    };
  });
}

export async function getDashboardOperationsData(user: AppUser): Promise<DashboardOperationsResponse> {
  const fetchedAt = new Date().toISOString();
  const [trains, telemetryOverview, accessRequests, recentEvents, alerts] = await Promise.all([
    listAccessibleTrains(
      {
        limit: 100,
        sortBy: "updatedAt",
        sortDir: "desc"
      },
      user
    ),
    listCurrentTelemetry(20, user),
    listAccessRequestsForUser(user),
    listOperationalEvents({ limit: 10 }, user),
    listAlerts({ status: "active", limit: 100 }, user)
  ]);

  const telemetryByTrainId = new Map(telemetryOverview.snapshots.map((snapshot) => [snapshot.trainId, snapshot]));
  const clearanceQueue = buildClearanceQueue(trains, telemetryByTrainId);
  const activeIncidents = alerts.alerts
    .filter((alert) => alert.severity === "high" || alert.severity === "critical")
    .slice(0, 8);
  const fleetHealth = telemetryOverview.snapshots
    .filter((snapshot) => snapshot.freshnessState === "stale" || snapshot.freshnessState === "offline")
    .slice(0, 8);
  const transitWatch = telemetryOverview.snapshots
    .filter((snapshot) => snapshot.displayJourneyStage === "in-transit" || snapshot.movementState === "moving")
    .slice(0, 8);

  return {
    summary: {
      visibleTrains: trains.length,
      pendingRequests:
        user.role === "admin" || user.role === "master"
          ? accessRequests.filter((request) => request.status === "pending").length
          : accessRequests.length,
      pendingClearance: clearanceQueue.length,
      activeIncidents: activeIncidents.length,
      staleOrOffline: fleetHealth.length,
      movingTrains: telemetryOverview.summary.movingTrains
    },
    accessRequests,
    clearanceQueue,
    visibleTrains: buildVisibleTrains(trains, telemetryByTrainId),
    activeIncidents,
    fleetHealth,
    transitWatch,
    recentEvents: recentEvents.events,
    fetchedAt
  };
}
