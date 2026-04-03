"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SystemStatusSummary } from "@/services/system/system-status";

const badgeStyles = {
  healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  degraded: "border-secondary/30 bg-secondary/10 text-secondary",
  offline: "border-destructive/30 bg-destructive/10 text-destructive",
  demo: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
} as const;

export function AppStatusIndicators() {
  const statusQuery = useQuery({
    queryKey: ["shell", "system-status"],
    queryFn: fetchSystemStatus,
    staleTime: 30_000
  });

  if (statusQuery.isLoading) {
    return (
      <div className="hidden items-center gap-2 xl:flex">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    );
  }

  if (statusQuery.isError || !statusQuery.data) {
    return null;
  }

  return (
    <div className="hidden items-center gap-2 xl:flex">
      {statusQuery.data.items.map((item) => (
        <Badge
          key={item.key}
          variant="outline"
          className={badgeStyles[item.level]}
          title={item.detail}
        >
          {item.label}: {item.detail}
        </Badge>
      ))}
    </div>
  );
}

async function fetchSystemStatus(): Promise<SystemStatusSummary> {
  const response = await fetch("/api/system/status", {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load system status.");
  }

  return response.json() as Promise<SystemStatusSummary>;
}
