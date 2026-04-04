"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  cargoTypeLabels,
  clearanceStatusLabels,
  journeyStageLabels,
  trainStatusLabels,
  type Train,
  type TrainStatus,
  weightStatusLabels
} from "@/types/train";

const statusBadgeStyles: Record<TrainStatus, string> = {
  active: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  idle: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
  warning: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  critical: "bg-red-500/12 text-red-700 dark:text-red-300",
  offline: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400"
};

const statusDotStyles: Record<TrainStatus, string> = {
  active: "bg-emerald-500",
  idle: "bg-slate-400",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  offline: "bg-zinc-400"
};

const weightBadgeStyles: Record<Train["weightStatus"], string> = {
  unknown: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400",
  safe: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  underweight: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  overweight: "bg-red-500/12 text-red-700 dark:text-red-300"
};

type TrainDetailHeaderProps = {
  train: Train;
};

export function TrainDetailHeader({ train }: TrainDetailHeaderProps) {
  const routeDisplay = [train.origin, train.destination].filter(Boolean).join(" -> ");

  return (
    <section className="rounded-[2rem] border border-border/60 bg-card/75 p-6 shadow-panel sm:p-8">
      <Link
        href="/fleet"
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Fleet
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-full", statusDotStyles[train.status])} />
            <Badge className={statusBadgeStyles[train.status]}>{trainStatusLabels[train.status]}</Badge>
            <Badge variant="outline">{train.code}</Badge>
            <Badge variant="outline">{cargoTypeLabels[train.cargoType]}</Badge>
            <Badge variant="outline">{journeyStageLabels[train.journeyStage]}</Badge>
            <Badge className={weightBadgeStyles[train.weightStatus]}>{weightStatusLabels[train.weightStatus]}</Badge>
            <Badge variant="outline">{clearanceStatusLabels[train.clearanceStatus]}</Badge>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {train.label}
            </h1>

            {routeDisplay ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {routeDisplay}
              </p>
            ) : train.routeName ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {train.routeName}
              </p>
            ) : null}

            {train.description ? <p className="text-sm text-muted-foreground">{train.description}</p> : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{train.carCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cars</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{train.maxSpeed ?? "N/A"}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">km/h max</p>
          </div>
        </div>
      </div>
    </section>
  );
}
