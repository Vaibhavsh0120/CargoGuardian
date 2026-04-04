"use client";

import { Activity, Gauge, MemoryStick, RouteIcon, ShieldCheck, Timer } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  blynkProvisioningStatusLabels,
  clearanceStatusLabels,
  weightStatusLabels,
  type Train
} from "@/types/train";

type TrainOverviewGridProps = {
  train: Train;
};

export function TrainOverviewGrid({ train }: TrainOverviewGridProps) {
  const routeValue = train.routeName || [train.origin, train.destination].filter(Boolean).join(" -> ") || "Not set";

  const items = [
    {
      key: "telemetry",
      label: "Telemetry feed",
      description: train.lastSeen
        ? `Latest telemetry arrived ${formatRelativeTime(train.lastSeen)}.`
        : "Waiting for the first webhook update from Blynk or the demo simulator.",
      icon: Activity,
      value: train.lastSeen ? "Live" : "Pending"
    },
    {
      key: "clearance",
      label: "Clearance",
      description: train.clearanceGrantedAt
        ? `Granted ${formatRelativeTime(train.clearanceGrantedAt)}${train.clearanceMethod ? ` by ${train.clearanceMethod}` : ""}.`
        : "This train is still in pre-departure handling.",
      icon: ShieldCheck,
      value: clearanceStatusLabels[train.clearanceStatus]
    },
    {
      key: "weight",
      label: "Weight state",
      description:
        train.weightStatus === "underweight"
          ? "Efficiency warning. Hardware should blink the shared warning light."
          : train.weightStatus === "overweight"
            ? "Safety warning. Hardware should keep the shared warning light solid."
            : train.weightStatus === "safe"
              ? "Train weight is inside the safe operating band."
              : "No verified weight reading yet.",
      icon: Gauge,
      value: weightStatusLabels[train.weightStatus]
    },
    {
      key: "device",
      label: "Blynk link",
      description: train.blynkDeviceId
        ? `Linked to Blynk device ${train.blynkDeviceId}.`
        : train.blynkAuthToken
          ? "Linked by Auth Token. Save the Blynk device id later if you need it."
          : train.blynkProvisioningError ?? "No Blynk link is stored for this train.",
      icon: MemoryStick,
      value: blynkProvisioningStatusLabels[train.blynkProvisioningStatus]
    },
    {
      key: "route",
      label: "Route setup",
      description:
        train.origin || train.destination || train.routeName
          ? "Basic route metadata is available for this train."
          : "Route tracking will improve once GPS telemetry and route metadata are connected.",
      icon: RouteIcon,
      value: routeValue
    },
    {
      key: "updated",
      label: "Last updated",
      description: "Most recent train record change in CargoGuardian.",
      icon: Timer,
      value: formatRelativeTime(train.updatedAt)
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-border/60 bg-card/90 shadow-panel">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="max-w-[60%] text-right font-display text-xl font-bold text-foreground">
                  {item.value}
                </span>
              </div>
              <div className="space-y-1">
                <CardTitle className="font-display text-base font-bold">{item.label}</CardTitle>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </CardHeader>
            <CardContent />
          </Card>
        );
      })}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Unknown";
  }
}
