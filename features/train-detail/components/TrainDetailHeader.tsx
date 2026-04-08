"use client";

import Link from "next/link";
import { ArrowLeft, Link2, MapPin, TrainFront } from "lucide-react";

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
  const hardwareLabel = train.blynkDeviceId ? "Linked" : train.blynkAuthToken ? "Token ready" : "Missing";

  return (
    <section className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-panel sm:p-6">
      <Link
        href="/fleet"
        className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Fleet
      </Link>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] xl:items-end">
        <div className="space-y-4">
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

            {train.description ? <p className="max-w-3xl text-sm text-muted-foreground">{train.description}</p> : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <HeaderMetric
            icon={TrainFront}
            label="Cars"
            value={String(train.carCount)}
            description="Loaded consist"
          />
          <HeaderMetric
            icon={MapPin}
            label="Max speed"
            value={train.maxSpeed === null ? "N/A" : String(train.maxSpeed)}
            description="km/h ceiling"
          />
          <HeaderMetric
            icon={Link2}
            label="Hardware"
            value={hardwareLabel}
            description={train.blynkDeviceId ?? "Blynk link"}
          />
        </div>
      </div>
    </section>
  );
}

function HeaderMetric({
  icon: Icon,
  label,
  value,
  description
}: Readonly<{
  icon: typeof TrainFront;
  label: string;
  value: string;
  description: string;
}>) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-background/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
