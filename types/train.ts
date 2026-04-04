export const TRAIN_STATUS_VALUES = ["active", "idle", "warning", "critical", "offline"] as const;

export type TrainStatus = (typeof TRAIN_STATUS_VALUES)[number];

export const CLEARANCE_STATUS_VALUES = ["pending", "granted", "revoked"] as const;

export type ClearanceStatus = (typeof CLEARANCE_STATUS_VALUES)[number];

export const JOURNEY_STAGE_VALUES = [
  "inspection",
  "clearance-pending",
  "cleared",
  "in-transit",
  "incident",
  "offline"
] as const;

export type JourneyStage = (typeof JOURNEY_STAGE_VALUES)[number];

export const WEIGHT_STATUS_VALUES = ["unknown", "safe", "underweight", "overweight"] as const;

export type WeightStatus = (typeof WEIGHT_STATUS_VALUES)[number];

export const CLEARANCE_METHOD_VALUES = ["remote", "rfid"] as const;

export type ClearanceMethod = (typeof CLEARANCE_METHOD_VALUES)[number];

export const BLYNK_PROVISIONING_STATUS_VALUES = ["provisioned", "failed"] as const;

export type BlynkProvisioningStatus = (typeof BLYNK_PROVISIONING_STATUS_VALUES)[number];

export type TrainSelectorSource = "firestore" | "empty";

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

export const clearanceStatusLabels: Record<ClearanceStatus, string> = {
  pending: "Pending",
  granted: "Granted",
  revoked: "Revoked"
};

export const journeyStageLabels: Record<JourneyStage, string> = {
  inspection: "Inspection",
  "clearance-pending": "Clearance Pending",
  cleared: "Cleared",
  "in-transit": "In Transit",
  incident: "Incident",
  offline: "Offline"
};

export const weightStatusLabels: Record<WeightStatus, string> = {
  unknown: "Unknown",
  safe: "Safe",
  underweight: "Underweight",
  overweight: "Overweight"
};

export const blynkProvisioningStatusLabels: Record<BlynkProvisioningStatus, string> = {
  provisioned: "Linked",
  failed: "Failed"
};

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
  clearanceStatus: ClearanceStatus;
  clearanceGrantedAt: string | null;
  clearanceGrantedBy: string | null;
  clearanceMethod: ClearanceMethod | null;
  journeyStage: JourneyStage;
  weightStatus: WeightStatus;
  cargoType: CargoType;
  carCount: number;
  maxSpeed: number | null;
  origin: string | null;
  destination: string | null;
  routeId: string | null;
  routeName: string | null;
  description: string | null;
  ownerId: string;
  blynkProvisioningStatus: BlynkProvisioningStatus;
  blynkProvisioningError: string | null;
  blynkTemplateId: string | null;
  blynkTemplateName: string | null;
  blynkAuthToken: string | null;
  blynkDeviceId: string | null;
  firmware: string | null;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainListItem = Pick<
  Train,
  | "id"
  | "code"
  | "label"
  | "status"
  | "clearanceStatus"
  | "journeyStage"
  | "weightStatus"
  | "cargoType"
  | "carCount"
  | "origin"
  | "destination"
  | "routeName"
  | "lastSeen"
  | "updatedAt"
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
  blynkAuthToken: string;
  blynkDeviceId: string | null;
};
