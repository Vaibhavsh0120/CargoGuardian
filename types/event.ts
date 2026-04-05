import type { UserRole } from "@/types/user";

export const EVENT_CATEGORY_VALUES = ["access", "alert", "clearance", "telemetry"] as const;

export type EventCategory = (typeof EVENT_CATEGORY_VALUES)[number];

export const EVENT_SEVERITY_VALUES = ["info", "warning", "critical"] as const;

export type EventSeverity = (typeof EVENT_SEVERITY_VALUES)[number];

export type EventMetadataValue = boolean | number | string | null;

export type EventMetadata = Record<string, EventMetadataValue>;

export type OperationalEvent = {
  id: string;
  category: EventCategory;
  action: string;
  severity: EventSeverity;
  title: string;
  description: string;
  trainId: string | null;
  trainCode: string | null;
  trainLabel: string | null;
  actorId: string | null;
  actorLabel: string | null;
  actorRole: UserRole | null;
  createdAt: string;
  metadata: EventMetadata;
};

export type HistoryListResponse = {
  events: OperationalEvent[];
  fetchedAt: string;
};

export const eventCategoryLabels: Record<EventCategory, string> = {
  access: "Access",
  alert: "Alert",
  clearance: "Clearance",
  telemetry: "Telemetry"
};

export const eventSeverityLabels: Record<EventSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical"
};
