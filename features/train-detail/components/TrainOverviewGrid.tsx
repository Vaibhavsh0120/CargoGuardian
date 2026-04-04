"use client";

import { Activity, Bell, MemoryStick, RouteIcon, Gauge, Timer } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Train } from "@/types/train";

type TrainOverviewGridProps = {
  train: Train;
};

const gridItems = [
  {
    key: "telemetry",
    label: "Live telemetry",
    description: "Real-time sensor readings will appear once a device is paired.",
    icon: Activity,
    value: "Pending"
  },
  {
    key: "alerts",
    label: "Active alerts",
    description: "Alert monitoring will be available after telemetry is connected.",
    icon: Bell,
    value: "0"
  },
  {
    key: "devices",
    label: "Paired devices",
    description: "Hardware pairing is available after device inventory is set up.",
    icon: MemoryStick,
    value: "0"
  },
  {
    key: "route",
    label: "Route progress",
    description: "Route tracking will activate once waypoints and GPS data are connected.",
    icon: RouteIcon,
    value: "—"
  }
];

export function TrainOverviewGrid({ train }: TrainOverviewGridProps) {
  const dynamicItems = [
    ...gridItems,
    {
      key: "speed",
      label: "Max speed",
      description: "Maximum rated speed for this train configuration.",
      icon: Gauge,
      value: train.maxSpeed ? `${train.maxSpeed} km/h` : "N/A"
    },
    {
      key: "updated",
      label: "Last updated",
      description: "Most recent data change timestamp.",
      icon: Timer,
      value: formatRelativeTime(train.updatedAt)
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {dynamicItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-border/60 bg-card/90 shadow-panel">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="font-display text-2xl font-bold text-foreground">{item.value}</span>
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
