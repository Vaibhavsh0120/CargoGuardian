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
