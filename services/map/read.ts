import "server-only";

import { listAlerts } from "@/services/alerts/read";
import { listRoutesForTrainIds } from "@/services/routes/read";
import { getTelemetryHistory, listCurrentTelemetry } from "@/services/telemetry/read";
import { listAccessibleTrains } from "@/services/trains/read";
import type { MapIncidentMarker, MapTrainRecord, MapWorkspaceResponse } from "@/types/map";
import type { AppUser } from "@/types/user";

function buildIncidentMarkers(trains: MapTrainRecord[]): MapIncidentMarker[] {
  return trains
    .flatMap((record) =>
      record.activeAlerts.map((alert) => {
        const fallbackLat = alert.gpsLat ?? record.telemetry.gpsLat;
        const fallbackLng = alert.gpsLng ?? record.telemetry.gpsLng;

        if (fallbackLat === null || fallbackLng === null) {
          return null;
        }

        return {
          alertId: alert.id,
          trainId: alert.trainId,
          trainCode: alert.trainCode,
          trainLabel: alert.trainLabel,
          title: alert.title,
          severity: alert.severity,
          status: alert.status,
          detectedAt: alert.detectedAt,
          lastObservedAt: alert.lastObservedAt,
          lat: fallbackLat,
          lng: fallbackLng
        } satisfies MapIncidentMarker;
      })
    )
    .filter((marker): marker is MapIncidentMarker => marker !== null)
    .sort((left, right) => new Date(right.lastObservedAt).getTime() - new Date(left.lastObservedAt).getTime());
}

export async function getMapWorkspace(user?: AppUser): Promise<MapWorkspaceResponse> {
  const fetchedAt = new Date().toISOString();

  const trains = await listAccessibleTrains(
    {
      limit: 100,
      sortBy: "updatedAt",
      sortDir: "desc"
    },
    user
  );

  if (!trains.length) {
    return {
      trains: [],
      incidents: [],
      fetchedAt
    };
  }

  const [telemetryCurrent, alertList, routesByTrainId, historyByTrain] = await Promise.all([
    listCurrentTelemetry(100, user),
    listAlerts({ status: "active", limit: 100 }, user),
    listRoutesForTrainIds(trains.map((train) => train.id)),
    Promise.all(
      trains.map(async (train) => {
        const history = await getTelemetryHistory(train.id, 24, user);
        return [train.id, history?.history ?? []] as const;
      })
    )
  ]);

  const telemetryOrder = new Map(telemetryCurrent.snapshots.map((snapshot, index) => [snapshot.trainId, index]));
  const telemetryByTrainId = new Map(telemetryCurrent.snapshots.map((snapshot) => [snapshot.trainId, snapshot]));
  const alertsByTrainId = new Map<string, typeof alertList.alerts>();

  alertList.alerts.forEach((alert) => {
    const current = alertsByTrainId.get(alert.trainId) ?? [];
    current.push(alert);
    alertsByTrainId.set(alert.trainId, current);
  });

  const breadcrumbsByTrainId = new Map(historyByTrain);

  const records = trains
    .map((train) => {
      const telemetry = telemetryByTrainId.get(train.id);
      if (!telemetry) {
        return null;
      }

      return {
        train,
        telemetry,
        route: routesByTrainId.get(train.id) ?? null,
        breadcrumbs: (breadcrumbsByTrainId.get(train.id) ?? []).filter(
          (point) => point.gpsLat !== null && point.gpsLng !== null
        ),
        activeAlerts: alertsByTrainId.get(train.id) ?? []
      } satisfies MapTrainRecord;
    })
    .filter((record): record is MapTrainRecord => record !== null)
    .sort((left, right) => {
      const leftOrder = telemetryOrder.get(left.train.id) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = telemetryOrder.get(right.train.id) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });

  return {
    trains: records,
    incidents: buildIncidentMarkers(records),
    fetchedAt
  };
}
