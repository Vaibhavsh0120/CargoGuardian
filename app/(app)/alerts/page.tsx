"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/PageHeader";
import { AlertsPageSkeleton } from "@/components/states/PageSkeletons";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { toast } from "@/components/ui/toast";
import { AlertDetailPanel } from "@/features/alerts/components/AlertDetailPanel";
import { AlertFilters } from "@/features/alerts/components/AlertFilters";
import { AlertList } from "@/features/alerts/components/AlertList";
import { useSession } from "@/features/auth/hooks/useSession";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import type { AlertListResponse, AlertRecord, AlertSeverity, AlertStatus } from "@/types/alert";

const EMPTY_ALERTS: AlertRecord[] = [];

async function fetchAlerts(status: AlertStatus | "active" | "all", severity: AlertSeverity | "all") {
  const response = await fetch(`/api/alerts?status=${status}&severity=${severity}&limit=100`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load alerts.");
  }

  return response.json() as Promise<AlertListResponse>;
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const sessionQuery = useSession();
  const [status, setStatus] = useState<AlertStatus | "active" | "all">("active");
  const [severity, setSeverity] = useState<AlertSeverity | "all">("all");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const alertsQuery = useQuery({
    queryKey: ["alerts", status, severity],
    queryFn: () => fetchAlerts(status, severity),
    staleTime: 15_000,
    placeholderData: keepPreviousData
  });

  useLiveRefresh({
    queryKeys: [["alerts", status, severity]],
    enabled: true
  });

  const alerts = alertsQuery.data?.alerts ?? EMPTY_ALERTS;
  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.id === selectedAlertId) ?? alerts[0] ?? null,
    [alerts, selectedAlertId]
  );
  const canManage = sessionQuery.data?.user?.role === "admin" || sessionQuery.data?.user?.role === "master";

  useEffect(() => {
    if (!selectedAlertId && alerts[0]) {
      setSelectedAlertId(alerts[0].id);
    }
  }, [alerts, selectedAlertId]);

  async function mutateAlert(alert: AlertRecord, action: "acknowledge" | "resolve") {
    setActiveAction(alert.id);

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
        queryClient.invalidateQueries({ queryKey: ["dashboard", "operations"] })
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} alert.`);
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operational incidents"
        title="Alerts"
      />

      <AlertFilters status={status} onStatusChange={setStatus} severity={severity} onSeverityChange={setSeverity} />

      {alertsQuery.isLoading ? (
        <AlertsPageSkeleton />
      ) : alertsQuery.isError ? (
        <ErrorState
          title="Alerts could not be loaded"
          description="The alert feed is unavailable right now."
          onAction={() => {
            void alertsQuery.refetch();
          }}
        />
      ) : !alerts.length ? (
        <EmptyState
          title="No alerts match these filters"
          description="Try a broader severity or status filter, or return later when the fleet produces a new incident."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <AlertList alerts={alerts} selectedAlertId={selectedAlert?.id ?? null} onSelect={(alert) => setSelectedAlertId(alert.id)} />
          <AlertDetailPanel
            alert={selectedAlert}
            canManage={canManage}
            isSubmitting={activeAction === selectedAlert?.id}
            onAcknowledge={(alert) => void mutateAlert(alert, "acknowledge")}
            onResolve={(alert) => void mutateAlert(alert, "resolve")}
          />
        </div>
      )}
    </div>
  );
}
