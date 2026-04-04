export const TRAIN_STATUS_VALUES = ["active", "idle", "warning", "critical", "offline"] as const;

export type TrainStatus = (typeof TRAIN_STATUS_VALUES)[number];

export type TrainSelectorSource = "firestore" | "demo" | "empty";

export type TrainSelectorItem = {
  id: string;
  code: string;
  label: string;
  status: TrainStatus;
  routeName: string | null;
  lastUpdatedAt: string | null;
};

export type TrainSelectorResponse = {
  trains: TrainSelectorItem[];
  source: TrainSelectorSource;
  fetchedAt: string;
};

export const trainStatusLabels: Record<TrainStatus, string> = {
  active: "Active",
  idle: "Idle",
  warning: "Warning",
  critical: "Critical",
  offline: "Offline"
};

// ── Full train document ──────────────────────────────────────────────

export const CARGO_TYPE_VALUES = [
  "general",
  "bulk",
  "liquid",
  "refrigerated",
  "hazardous",
  "container",
  "automotive",
  "livestock",
  "intermodal",
  "other"
] as const;

export type CargoType = (typeof CARGO_TYPE_VALUES)[number];

export const cargoTypeLabels: Record<CargoType, string> = {
  general: "General",
  bulk: "Bulk",
  liquid: "Liquid",
  refrigerated: "Refrigerated",
  hazardous: "Hazardous",
  container: "Container",
  automotive: "Automotive",
  livestock: "Livestock",
  intermodal: "Intermodal",
  other: "Other"
};

export type Train = {
  id: string;
  code: string;
  label: string;
  status: TrainStatus;
  cargoType: CargoType;
  carCount: number;
  maxSpeed: number | null;
  origin: string | null;
  destination: string | null;
  routeId: string | null;
  routeName: string | null;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type TrainListItem = Pick<
  Train,
  "id" | "code" | "label" | "status" | "cargoType" | "carCount" | "origin" | "destination" | "routeName" | "updatedAt"
>;

export type TrainSummary = {
  totalTrains: number;
  activeTrains: number;
  idleTrains: number;
  warningTrains: number;
  criticalTrains: number;
  offlineTrains: number;
};

export type CreateTrainInput = {
  code: string;
  label: string;
  cargoType: CargoType;
  carCount: number;
  maxSpeed: number | null;
  origin: string | null;
  destination: string | null;
  routeId: string | null;
  description: string | null;
};
