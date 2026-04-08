import type { AlertRecord } from "@/types/alert";
import type { Route } from "@/types/route";
import type { TelemetryHistoryPoint, TelemetrySnapshot } from "@/types/telemetry";
import type { Train } from "@/types/train";

export type MapTrainRecord = {
  train: Train;
  telemetry: TelemetrySnapshot;
  route: Route | null;
  breadcrumbs: TelemetryHistoryPoint[];
  activeAlerts: AlertRecord[];
};

export type MapIncidentMarker = {
  alertId: string;
  trainId: string;
  trainCode: string;
  trainLabel: string;
  title: string;
  severity: AlertRecord["severity"];
  status: AlertRecord["status"];
  detectedAt: string;
  lastObservedAt: string;
  lat: number;
  lng: number;
};

export type MapWorkspaceResponse = {
  trains: MapTrainRecord[];
  incidents: MapIncidentMarker[];
  fetchedAt: string;
};
