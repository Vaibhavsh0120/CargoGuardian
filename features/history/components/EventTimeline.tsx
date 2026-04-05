import { Activity, AlertTriangle, ShieldCheck, UserRoundCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import { eventCategoryLabels, type OperationalEvent } from "@/types/event";

const iconMap = {
  access: UserRoundCog,
  alert: AlertTriangle,
  clearance: ShieldCheck,
  telemetry: Activity
};

const severityStyles: Record<OperationalEvent["severity"], string> = {
  info: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
  warning: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  critical: "bg-red-500/12 text-red-700 dark:text-red-300"
};

export function EventTimeline({
  events,
  compact = false
}: Readonly<{
  events: OperationalEvent[];
  compact?: boolean;
}>) {
  return (
    <div className="space-y-3">
      {events.map((event) => {
        const Icon = iconMap[event.category];
        return (
          <div key={event.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={severityStyles[event.severity]}>{event.severity}</Badge>
                  <Badge variant="outline">{eventCategoryLabels[event.category]}</Badge>
                  {event.trainCode ? <Badge variant="outline">{event.trainCode}</Badge> : null}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
                {compact ? null : (
                  <p className="text-xs text-muted-foreground">
                    {event.actorLabel ? `${event.actorLabel} | ` : ""}
                    {formatDateTime(event.createdAt)} ({formatRelativeTime(event.createdAt)})
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
