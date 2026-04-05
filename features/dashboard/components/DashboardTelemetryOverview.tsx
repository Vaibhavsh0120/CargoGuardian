"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, MapPinned, RadioTower, TrainFront } from "lucide-react";
import type { ComponentType } from "react";

import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TelemetryFreshnessBadge } from "@/features/train-detail/components/TelemetryFreshnessBadge";
import { journeyStageLabels, trainStatusLabels, weightStatusLabels } from "@/types/train";
import type { TelemetryCurrentListResponse, TelemetrySnapshot } from "@/types/telemetry";

type DashboardTelemetryOverviewProps = {
  selectedTrainId: string | null;
};

async function fetchTelemetryOverview(): Promise<TelemetryCurrentListResponse> {
  const response = await fetch("/api/telemetry/current?limit=6", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load telemetry overview.");
  }

  return response.json() as Promise<TelemetryCurrentListResponse>;
}

export function DashboardTelemetryOverview({ selectedTrainId }: DashboardTelemetryOverviewProps) {
  const query = useQuery({
    queryKey: ["dashboard", "telemetry-overview"],
    queryFn: fetchTelemetryOverview,
    staleTime: 15_000
  });

  if (query.isLoading) {
    return <LoadingPanel compact />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Telemetry overview is unavailable"
        description="The dashboard could not load current train telemetry."
        onAction={() => {
          void query.refetch();
        }}
      />
    );
  }

  const snapshots = query.data?.snapshots ?? [];
  const summary = query.data?.summary;

  if (!snapshots.length || !summary) {
    return (
      <EmptyState
        title="No telemetry feed yet"
        description="The dashboard telemetry overview will appear once at least one visible train posts telemetry."
        icon={Activity}
      />
    );
  }

  const focusTrain = snapshots.find((snapshot) => snapshot.trainId === selectedTrainId) ?? snapshots[0];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Telemetry overview</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Live fleet telemetry</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard label="Fresh" value={summary.freshTrains} icon={Activity} />
        <SummaryCard label="Stale" value={summary.staleTrains} icon={RadioTower} />
        <SummaryCard label="Offline" value={summary.offlineTrains} icon={TrainFront} />
        <SummaryCard label="Moving" value={summary.movingTrains} icon={Gauge} />
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        <Card className="flex h-full flex-col border-border/60 bg-card/90 shadow-panel">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <TelemetryFreshnessBadge
                freshnessState={focusTrain.freshnessState}
                reportedAt={focusTrain.reportedAt}
                ageSeconds={focusTrain.ageSeconds}
              />
              <Badge>{trainStatusLabels[focusTrain.status]}</Badge>
              <Badge variant="outline">{focusTrain.trainCode}</Badge>
            </div>
            <div className="space-y-1">
              <CardTitle className="font-display text-3xl font-bold">{focusTrain.trainLabel}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {journeyStageLabels[focusTrain.displayJourneyStage]} | {weightStatusLabels[focusTrain.displayWeightStatus]}
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid flex-1 content-start gap-4 sm:grid-cols-3">
            <FocusMetric
              icon={Gauge}
              label="Speed"
              value={focusTrain.speedKmh === null ? "Unknown" : `${focusTrain.speedKmh.toFixed(1)} km/h`}
            />
            <FocusMetric
              icon={RadioTower}
              label="Weight"
              value={focusTrain.weightKg === null ? "Unavailable" : `${Math.round(focusTrain.weightKg).toLocaleString()} kg`}
            />
            <FocusMetric icon={MapPinned} label="Location" value={formatLocation(focusTrain)} />
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-border/60 bg-card/90 shadow-panel">
          <CardHeader className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Visible trains</p>
            <CardTitle className="font-display text-2xl font-bold tracking-tight">Current fleet feed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.trainId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{snapshot.trainLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {snapshot.trainCode} | {snapshot.speedKmh === null ? "speed pending" : `${snapshot.speedKmh.toFixed(1)} km/h`}
                  </p>
                </div>
                <TelemetryFreshnessBadge
                  freshnessState={snapshot.freshnessState}
                  reportedAt={snapshot.reportedAt}
                  ageSeconds={snapshot.ageSeconds}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function FocusMetric({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="font-display text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function formatLocation(snapshot: TelemetrySnapshot) {
  if (snapshot.gpsLat === null || snapshot.gpsLng === null) {
    return "No fix";
  }

  return `${snapshot.gpsLat.toFixed(3)}, ${snapshot.gpsLng.toFixed(3)}`;
}
