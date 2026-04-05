import { ALERT_SEVERITY_VALUES, alertSeverityLabels, type AlertSeverity, type AlertStatus } from "@/types/alert";

export function AlertFilters({
  status,
  onStatusChange,
  severity,
  onSeverityChange
}: Readonly<{
  status: AlertStatus | "active" | "all";
  onStatusChange: (value: AlertStatus | "active" | "all") => void;
  severity: AlertSeverity | "all";
  onSeverityChange: (value: AlertSeverity | "all") => void;
}>) {
  return (
    <div className="grid gap-3 rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-panel md:grid-cols-2">
      <label className="space-y-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as AlertStatus | "active" | "all")}
          className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="active">Active alerts</option>
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>

      <label className="space-y-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Severity</span>
        <select
          value={severity}
          onChange={(event) => onSeverityChange(event.target.value as AlertSeverity | "all")}
          className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All severities</option>
          {ALERT_SEVERITY_VALUES.map((value) => (
            <option key={value} value={value}>
              {alertSeverityLabels[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
