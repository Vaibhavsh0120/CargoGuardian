"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import {
  AlertSplitPanelSkeleton,
  TimelinePanelSkeleton,
  TrainDetailPageSkeleton
} from "@/components/states/PageSkeletons";
import { toast } from "@/components/ui/toast";
import { AlertDetailPanel } from "@/features/alerts/components/AlertDetailPanel";
import { AlertList } from "@/features/alerts/components/AlertList";
import { useSession } from "@/features/auth/hooks/useSession";
import { ClearanceActionPanel } from "@/features/clearance/components/ClearanceActionPanel";
import { EventTimeline } from "@/features/history/components/EventTimeline";
import { TrainDetailHeader } from "@/features/train-detail/components/TrainDetailHeader";
import { TrainDangerZone } from "@/features/train-detail/components/TrainDangerZone";
import { TelemetryGrid } from "@/features/train-detail/components/TelemetryGrid";
import { TelemetryTrendChart } from "@/features/train-detail/components/TelemetryTrendChart";
import { TrainOverviewGrid } from "@/features/train-detail/components/TrainOverviewGrid";
import { RouteProgressCard } from "@/features/train-detail/components/RouteProgressCard";
import { useTelemetry } from "@/features/train-detail/hooks/useTelemetry";
import { useTelemetryHistory } from "@/features/train-detail/hooks/useTelemetryHistory";
import { useTelemetryStream } from "@/features/train-detail/hooks/useTelemetryStream";
import { useTrain } from "@/features/train-detail/hooks/useTrain";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import type { AlertListResponse, AlertRecord } from "@/types/alert";
import type { HistoryListResponse } from "@/types/event";

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

async function fetchTrainHistory(trainId: string) {
  const response = await fetch(`/api/history?trainId=${encodeURIComponent(trainId)}&limit=8`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load train history.");
  }

  return response.json() as Promise<HistoryListResponse>;
}

export default function TrainDetailPage({ params }: TrainDetailPageProps) {
  const { trainId } = use(params);
  const queryClient = useQueryClient();
  const sessionQuery = useSession();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [activeAlertAction, setActiveAlertAction] = useState<string | null>(null);
  const { train, isLoading, isError, refetch } = useTrain(trainId);
  const telemetryQuery = useTelemetry(trainId);
  const historyQuery = useTelemetryHistory(trainId);
  const telemetryStream = useTelemetryStream(trainId);
  const alertsQuery = useQuery({
    queryKey: ["alerts", "train", trainId],
    queryFn: () => fetchTrainAlerts(trainId),
    staleTime: 15_000,
    enabled: Boolean(trainId)
  });
  const eventsQuery = useQuery({
    queryKey: ["history", "train", trainId],
    queryFn: () => fetchTrainHistory(trainId),
    staleTime: 15_000,
    enabled: Boolean(trainId)
  });

  useLiveRefresh({
    queryKeys: [
      ["trains", trainId],
      ["telemetry", "current", trainId],
      ["telemetry", "history", trainId],
      ["alerts", "train", trainId],
      ["history", "train", trainId]
    ],
    enabled: Boolean(trainId)
  });

  const alerts = alertsQuery.data?.alerts ?? EMPTY_ALERTS;
  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.id === selectedAlertId) ?? alerts[0] ?? null,
    [alerts, selectedAlertId]
  );
  const viewerRole = sessionQuery.data?.user?.role ?? "worker";
  const canManage = viewerRole === "admin" || viewerRole === "master";
  const canDeleteTrain = viewerRole === "admin";

  useEffect(() => {
    if (!selectedAlertId && alerts[0]) {
      setSelectedAlertId(alerts[0].id);
    }
  }, [alerts, selectedAlertId]);

  async function mutateAlert(alert: AlertRecord, action: "acknowledge" | "resolve") {
    setActiveAlertAction(alert.id);

    try {
      const response = await fetch(`/api/alerts/${alert.id}/${action}`, {
        method: "POST"
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? `Failed to ${action} alert.`);
      }

      toast.success(`Alert ${action}d.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["history"] }),
        queryClient.invalidateQueries({ queryKey: ["alerts", "train", trainId] }),
        queryClient.invalidateQueries({ queryKey: ["history", "train", trainId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "operations"] })
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} alert.`);
    } finally {
      setActiveAlertAction(null);
    }
  }

  if (isLoading) {
    return <TrainDetailPageSkeleton />;
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

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_24rem]">
        <div className="space-y-4">
          <TelemetryGrid
            telemetry={telemetryQuery.telemetry}
            isLoading={telemetryQuery.isLoading}
            isError={telemetryQuery.isError}
            streamMode={telemetryStream.mode}
            onRetry={() => {
              void telemetryQuery.refetch();
            }}
          />
          <TelemetryTrendChart
            history={historyQuery.history}
            isLoading={historyQuery.isLoading}
            isError={historyQuery.isError}
            onRetry={() => {
              void historyQuery.refetch();
            }}
          />
        </div>

        <div className="space-y-4">
          <RouteProgressCard train={train} canEditRoute={canManage} />
          <ClearanceActionPanel train={train} telemetry={telemetryQuery.telemetry} canManage={canManage} />
          <TrainOverviewGrid train={train} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        {alertsQuery.isLoading ? (
          <AlertSplitPanelSkeleton />
        ) : alerts.length ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:col-span-2">
            <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-panel">
              <div className="mb-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Alerts</p>
                <h2 className="font-display text-2xl font-bold text-foreground">Active incident context</h2>
              </div>
              <AlertList alerts={alerts} selectedAlertId={selectedAlert?.id ?? null} onSelect={(alert) => setSelectedAlertId(alert.id)} />
            </div>
            <AlertDetailPanel
              alert={selectedAlert}
              canManage={canManage}
              isSubmitting={activeAlertAction === selectedAlert?.id}
              onAcknowledge={(alert) => void mutateAlert(alert, "acknowledge")}
              onResolve={(alert) => void mutateAlert(alert, "resolve")}
            />
          </div>
        ) : (
          <>
            <EmptyState
              title="No train-scoped alerts"
              description="This train does not currently have an active or recently resolved alert in CargoGuardian."
            />
            <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-panel">
              <div className="mb-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Train history</p>
                <h2 className="font-display text-2xl font-bold text-foreground">Recent operational timeline</h2>
              </div>
              {eventsQuery.isLoading ? (
                <TimelinePanelSkeleton />
              ) : eventsQuery.isError ? (
                <ErrorState
                  title="Train history is unavailable"
                  description="The recent event trail for this train could not be loaded."
                  onAction={() => {
                    void eventsQuery.refetch();
                  }}
                />
              ) : eventsQuery.data?.events.length ? (
                <EventTimeline events={eventsQuery.data.events} />
              ) : (
                <EmptyState
                  title="No operational history yet"
                  description="Clearance actions, access events, and alerts for this train will appear here as they happen."
                />
              )}
            </div>
          </>
        )}
      </div>

      {alerts.length ? (
        <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-panel">
          <div className="mb-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Train history</p>
            <h2 className="font-display text-2xl font-bold text-foreground">Recent operational timeline</h2>
          </div>
          {eventsQuery.isLoading ? (
            <TimelinePanelSkeleton />
          ) : eventsQuery.isError ? (
            <ErrorState
              title="Train history is unavailable"
              description="The recent event trail for this train could not be loaded."
              onAction={() => {
                void eventsQuery.refetch();
              }}
            />
          ) : eventsQuery.data?.events.length ? (
            <EventTimeline events={eventsQuery.data.events} />
          ) : (
            <EmptyState
              title="No operational history yet"
              description="Clearance actions, access events, and alerts for this train will appear here as they happen."
            />
          )}
        </div>
      ) : null}

      <TrainDangerZone train={train} canDelete={canDeleteTrain} />
    </div>
  );
}
