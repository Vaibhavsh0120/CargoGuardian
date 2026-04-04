"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  cargoTypeLabels,
  journeyStageLabels,
  trainStatusLabels,
  type TrainListItem,
  type TrainStatus,
  weightStatusLabels
} from "@/types/train";

const statusDotStyles: Record<TrainStatus, string> = {
  active: "bg-emerald-500",
  idle: "bg-slate-400",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  offline: "bg-zinc-400"
};

const statusBadgeStyles: Record<TrainStatus, string> = {
  active: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  idle: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
  warning: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  critical: "bg-red-500/12 text-red-700 dark:text-red-300",
  offline: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400"
};

const weightBadgeStyles: Record<TrainListItem["weightStatus"], string> = {
  unknown: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400",
  safe: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  underweight: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  overweight: "bg-red-500/12 text-red-700 dark:text-red-300"
};

type FleetTableProps = {
  trains: TrainListItem[];
};

export function FleetTable({ trains }: FleetTableProps) {
  return (
    <div className="space-y-3">
      {trains.map((train) => (
        <Link
          key={train.id}
          href={`/fleet/${train.id}` as Route}
          className="group block rounded-2xl border border-border/60 bg-card/90 p-4 shadow-panel transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-ambient sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-block h-2.5 w-2.5 rounded-full", statusDotStyles[train.status])} />
                <Badge className={statusBadgeStyles[train.status]}>{trainStatusLabels[train.status]}</Badge>
                <span className="text-xs font-medium text-muted-foreground">{train.code}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-foreground">{train.label}</h3>
                  {(train.origin ?? train.destination) ? (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {[train.origin, train.destination].filter(Boolean).join(" -> ")}
                    </p>
                  ) : train.routeName ? (
                    <p className="mt-1 truncate text-sm text-muted-foreground">{train.routeName}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{journeyStageLabels[train.journeyStage]}</Badge>
                  <Badge className={weightBadgeStyles[train.weightStatus]}>
                    {weightStatusLabels[train.weightStatus]}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {cargoTypeLabels[train.cargoType]}
                </span>
                <span className="hidden sm:inline">-</span>
                <span className="hidden sm:inline">{train.carCount} cars</span>
              </div>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
