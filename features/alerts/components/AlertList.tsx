"use client";

import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  alertSeverityLabels,
  alertStatusLabels,
  alertTypeLabels,
  type AlertRecord,
  type AlertSeverity
} from "@/types/alert";

const severityStyles: Record<AlertSeverity, string> = {
  low: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
  medium: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  high: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
  critical: "bg-red-500/12 text-red-700 dark:text-red-300"
};

export function AlertList({
  alerts,
  selectedAlertId,
  onSelect
}: Readonly<{
  alerts: AlertRecord[];
  selectedAlertId?: string | null;
  onSelect?: (alert: AlertRecord) => void;
}>) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <button
          key={alert.id}
          type="button"
          onClick={() => onSelect?.(alert)}
          className={cn(
            "block w-full rounded-2xl border border-border/60 bg-background/60 p-4 text-left transition hover:border-border hover:bg-background/80",
            selectedAlertId === alert.id && "border-primary/40 bg-primary/5"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={severityStyles[alert.severity]}>{alertSeverityLabels[alert.severity]}</Badge>
                <Badge variant="outline">{alertStatusLabels[alert.status]}</Badge>
                <Badge variant="outline">{alert.trainCode}</Badge>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {alertTypeLabels[alert.type]} | {formatDateTime(alert.lastObservedAt)} ({formatRelativeTime(alert.lastObservedAt)})
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
