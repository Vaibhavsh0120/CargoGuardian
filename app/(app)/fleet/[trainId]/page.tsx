"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { AlertList } from "@/features/alerts/components/AlertList";
import { useSession } from "@/features/auth/hooks/useSession";
import { ClearanceActionPanel } from "@/features/clearance/components/ClearanceActionPanel";
import { TrainDetailHeader } from "@/features/train-detail/components/TrainDetailHeader";
import { TelemetryGrid } from "@/features/train-detail/components/TelemetryGrid";
import { useTelemetry } from "@/features/train-detail/hooks/useTelemetry";
import { useTelemetryStream } from "@/features/train-detail/hooks/useTelemetryStream";
import { useTrain } from "@/features/train-detail/hooks/useTrain";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import type { AlertListResponse } from "@/types/alert";

const EMPTY_ALERTS: AlertRecord[] = [];

type TrainDetailPageProps = {
  params: Promise<{ trainId: string }>;
};

async function fetchTrainAlerts(trainId: string) {
  const response = await fetch(`/api/alerts?trainId=${encodeURIComponent(trainId)}&status=all&limit=8`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load train alerts.");
  }

  return response.json() as Promise<AlertListResponse>;
}

export default function TrainDetailPage({ params }: TrainDetailPageProps) {
  const { trainId } = use(params);
  const sessionQuery = useSession();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const { train, isLoading, isError, refetch } = useTrain(trainId);
  const telemetryQuery = useTelemetry(trainId);
  const telemetryStream = useTelemetryStream(trainId);
  const alertsQuery = useQuery({
    queryKey: ["alerts", "train", trainId],
    queryFn: () => fetchTrainAlerts(trainId),
    staleTime: 15_000,
    enabled: Boolean(trainId)
  });

  useLiveRefresh({
    queryKeys: [
      ["trains", trainId],
      ["telemetry", "current", trainId],
      ["alerts", "train", trainId]
    ],
    enabled: Boolean(trainId)
  });

  const alerts = alertsQuery.data?.alerts ?? EMPTY_ALERTS;
  const canManage = sessionQuery.data?.user?.role === "admin" || sessionQuery.data?.user?.role === "master";

  if (isLoading) {
    return <LoadingPanel />;
  }

  if (isError || !train) {
    return (
      <ErrorState
        title="Train not found"
        description="The requested train could not be loaded. It may have been removed or you may not have access."
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <TrainDetailHeader train={train} />

      <ClearanceActionPanel train={train} telemetry={telemetryQuery.telemetry} canManage={canManage} />

      <TelemetryGrid
        telemetry={telemetryQuery.telemetry}
        isLoading={telemetryQuery.isLoading}
        isError={telemetryQuery.isError}
        streamMode={telemetryStream.mode}
        onRetry={() => {
          void telemetryQuery.refetch();
        }}
      />

      {alertsQuery.isLoading ? (
        <LoadingPanel compact />
      ) : alerts.length ? (
        <div className="rounded-lg border border-border/40 bg-card/50 p-4">
          <div className="mb-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Active alerts</p>
            <h2 className="font-display text-lg font-bold text-foreground">Open incidents</h2>
          </div>
          <AlertList alerts={alerts.slice(0, 3)} selectedAlertId={selectedAlert?.id ?? null} onSelect={(alert) => setSelectedAlertId(alert.id)} />
        </div>
      ) : null}
    </div>
  );
}
