"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TelemetryFreshnessState } from "@/types/telemetry";

const freshnessStyles: Record<TelemetryFreshnessState, string> = {
  fresh: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  stale: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  offline: "bg-zinc-500/12 text-zinc-700 dark:text-zinc-300"
};

type TelemetryFreshnessBadgeProps = {
  freshnessState: TelemetryFreshnessState;
  reportedAt: string | null;
  ageSeconds: number | null;
  className?: string;
};

export function TelemetryFreshnessBadge({
  freshnessState,
  reportedAt,
  ageSeconds,
  className
}: TelemetryFreshnessBadgeProps) {
  return (
    <Badge className={cn(freshnessStyles[freshnessState], className)}>
      {formatFreshnessLabel(freshnessState, reportedAt, ageSeconds)}
    </Badge>
  );
}

function formatFreshnessLabel(
  freshnessState: TelemetryFreshnessState,
  reportedAt: string | null,
  ageSeconds: number | null
) {
  if (!reportedAt) {
    return "No feed yet";
  }

  if (ageSeconds === null) {
    return freshnessState === "offline" ? "Offline" : "Pending";
  }

  if (ageSeconds < 60) {
    return `${capitalize(freshnessState)} ${ageSeconds}s`;
  }

  const ageMinutes = Math.floor(ageSeconds / 60);

  if (ageMinutes < 60) {
    return `${capitalize(freshnessState)} ${ageMinutes}m`;
  }

  const ageHours = Math.floor(ageMinutes / 60);
  return `${capitalize(freshnessState)} ${ageHours}h`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
