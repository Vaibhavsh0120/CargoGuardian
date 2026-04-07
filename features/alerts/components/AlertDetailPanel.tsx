"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/date";
import { alertSeverityLabels, alertStatusLabels, alertTypeLabels, type AlertRecord } from "@/types/alert";

export function AlertDetailPanel({
  alert,
  canManage,
  isSubmitting = false,
  onAcknowledge,
  onResolve
}: Readonly<{
  alert: AlertRecord | null;
  canManage: boolean;
  isSubmitting?: boolean;
  onAcknowledge?: (alert: AlertRecord) => void;
  onResolve?: (alert: AlertRecord) => void;
}>) {
  if (!alert) {
    return (
      <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-6 shadow-panel">
        <p className="text-sm text-muted-foreground">Select an alert to review its full incident context.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-6 shadow-panel">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{alert.trainCode}</Badge>
          <Badge variant="outline">{alertTypeLabels[alert.type]}</Badge>
          <Badge variant="outline">{alertSeverityLabels[alert.severity]}</Badge>
          <Badge variant="outline">{alertStatusLabels[alert.status]}</Badge>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-foreground">{alert.title}</h2>
          <p className="text-sm text-muted-foreground">{alert.description}</p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Detected" value={formatDateTime(alert.detectedAt)} />
          <DetailItem label="Last observed" value={formatDateTime(alert.lastObservedAt)} />
          <DetailItem label="Journey stage" value={alert.journeyStage} />
          <DetailItem label="Weight state" value={alert.weightStatus} />
          <DetailItem label="Weight" value={alert.weightKg === null ? "Unavailable" : `${Math.round(alert.weightKg)} kg`} />
          <DetailItem label="Location" value={alert.gpsLat === null || alert.gpsLng === null ? "No fix" : `${alert.gpsLat.toFixed(4)}, ${alert.gpsLng.toFixed(4)}`} />
        </dl>

        {canManage ? (
          <div className="flex max-w-xs flex-col gap-2">
            {alert.status === "open" ? (
              <Button className="w-full" disabled={isSubmitting} onClick={() => onAcknowledge?.(alert)}>
                Acknowledge
              </Button>
            ) : null}
            {alert.status !== "resolved" ? (
              <Button className="w-full" variant="outline" disabled={isSubmitting} onClick={() => onResolve?.(alert)}>
                Resolve
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}
