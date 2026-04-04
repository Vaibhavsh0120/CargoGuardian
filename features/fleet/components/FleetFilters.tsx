"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TRAIN_STATUS_VALUES, trainStatusLabels, type TrainStatus } from "@/types/train";

const statusFilterStyles: Record<TrainStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  idle: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  critical: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  offline: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
};

type FleetFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TrainStatus | undefined;
  onStatusFilterChange: (status: TrainStatus | undefined) => void;
};

export function FleetFilters({ search, onSearchChange, statusFilter, onStatusFilterChange }: FleetFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="fleet-search"
          placeholder="Search trains by name, code, origin, or destination…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onStatusFilterChange(undefined)}
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-all",
            !statusFilter
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 bg-transparent text-muted-foreground hover:bg-muted"
          )}
        >
          All
        </button>
        {TRAIN_STATUS_VALUES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusFilterChange(statusFilter === status ? undefined : status)}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-all",
              statusFilter === status
                ? statusFilterStyles[status]
                : "border-border/60 bg-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            {trainStatusLabels[status]}
          </button>
        ))}
      </div>
    </div>
  );
}
