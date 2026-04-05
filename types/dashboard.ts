import type { AccessRequest } from "@/types/access";
import type { AlertRecord } from "@/types/alert";
import type { OperationalEvent } from "@/types/event";
import type { TelemetryFreshnessState, TelemetrySnapshot } from "@/types/telemetry";
import type { ClearanceStatus, JourneyStage, TrainStatus, WeightStatus } from "@/types/train";

export type DashboardClearanceQueueItem = {
  id: string;
  code: string;
  label: string;
  routeName: string | null;
  journeyStage: JourneyStage;
  clearanceStatus: ClearanceStatus;
  weightStatus: WeightStatus;
  freshnessState: TelemetryFreshnessState;
  reportedAt: string | null;
};

export type DashboardVisibleTrainItem = {
  id: string;
  code: string;
  label: string;
  status: TrainStatus;
  journeyStage: JourneyStage;
  clearanceStatus: ClearanceStatus;
  routeName: string | null;
  freshnessState: TelemetryFreshnessState;
  reportedAt: string | null;
};

export type DashboardOperationsData = {
  summary: {
    visibleTrains: number;
    pendingRequests: number;
    pendingClearance: number;
    activeIncidents: number;
    staleOrOffline: number;
    movingTrains: number;
  };
  accessRequests: AccessRequest[];
  clearanceQueue: DashboardClearanceQueueItem[];
  visibleTrains: DashboardVisibleTrainItem[];
  activeIncidents: AlertRecord[];
  fleetHealth: TelemetrySnapshot[];
  transitWatch: TelemetrySnapshot[];
  recentEvents: OperationalEvent[];
};
