"use client";

import { Box, Clock3, Cpu, MemoryStick } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cargoTypeLabels, type Train } from "@/types/train";

type TrainOverviewGridProps = {
  train: Train;
};

export function TrainOverviewGrid({ train }: TrainOverviewGridProps) {
  const items = [
    {
      key: "profile",
      label: "Cargo profile",
      description: `${train.code} | ${train.carCount} car${train.carCount === 1 ? "" : "s"}${train.maxSpeed ? ` | ${train.maxSpeed} km/h max` : ""}.`,
      icon: Box,
      value: cargoTypeLabels[train.cargoType]
    },
    {
      key: "device",
      label: "Hardware link",
      description: train.blynkDeviceId
        ? `Linked to Blynk device ${train.blynkDeviceId}.`
        : train.blynkAuthToken
          ? "Auth token is stored for server-side commands."
          : train.blynkProvisioningError ?? "No device credential is stored for this train.",
      icon: MemoryStick,
      value: train.blynkDeviceId ? "Linked" : train.blynkAuthToken ? "Token ready" : "Missing"
    },
    {
      key: "firmware",
      label: "Firmware",
      description: train.firmware
        ? "Stored firmware version from the train record."
        : "No firmware version has been recorded yet.",
      icon: Cpu,
      value: train.firmware ?? "Unknown"
    },
    {
      key: "timing",
      label: "Record timing",
      description: `Created ${formatRelativeTime(train.createdAt)}${train.lastSeen ? ` | Last seen ${formatRelativeTime(train.lastSeen)}` : ""}.`,
      icon: Clock3,
      value: formatRelativeTime(train.updatedAt)
    }
  ];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Extra record context</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Train profile and hardware</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} className="border-border/60 bg-card/90 shadow-panel">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="max-w-[65%] text-right font-display text-xl font-bold text-foreground">
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
    </section>
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
