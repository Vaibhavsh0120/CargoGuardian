"use client";

import { TrainFront } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrainContext } from "@/hooks/useTrainContext";
import { cn } from "@/lib/utils";
import { trainStatusLabels } from "@/types/train";

const statusBadgeStyles = {
  active: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  idle: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
  warning: "bg-secondary/15 text-secondary",
  critical: "bg-destructive/15 text-destructive",
  offline: "bg-muted text-muted-foreground"
} as const;

export function TrainSelector({ className }: Readonly<{ className?: string }>) {
  const { isLoading, isError, refresh, selectedTrain, selectedTrainId, setSelectedTrainId, trains } =
    useTrainContext();

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-border/70 bg-card/85 p-4 shadow-panel", className)}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-11 w-full" />
        <Skeleton className="mt-3 h-3 w-40" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("rounded-2xl border border-destructive/20 bg-card/90 p-4 shadow-panel", className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">Train selector</p>
            <p className="text-sm text-muted-foreground">The fleet list could not be loaded.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card/85 p-4 shadow-panel", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
            Selected train
          </p>
          <p className="text-xs text-muted-foreground">
            {trains.length
              ? "Selection is persisted across refreshes."
              : "Add train records to populate this workspace."}
          </p>
        </div>
        {selectedTrain ? (
          <Badge className={statusBadgeStyles[selectedTrain.status]}>{trainStatusLabels[selectedTrain.status]}</Badge>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <TrainFront className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <select
            value={selectedTrainId ?? ""}
            onChange={(event) => {
              setSelectedTrainId(event.target.value || null);
            }}
            disabled={!trains.length}
            className="h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-sm font-semibold text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            {!trains.length ? <option value="">No trains available</option> : null}
            {trains.map((train) => (
              <option key={train.id} value={train.id}>
                {train.label}
              </option>
            ))}
          </select>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {selectedTrain
              ? `${selectedTrain.code}${selectedTrain.routeName ? ` | ${selectedTrain.routeName}` : ""}`
              : "No train selected"}
          </p>
        </div>
      </div>
    </div>
  );
}
