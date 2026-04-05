import { EVENT_CATEGORY_VALUES, eventCategoryLabels, type EventCategory } from "@/types/event";

export function HistoryFilters({
  trainId,
  onTrainIdChange,
  category,
  onCategoryChange,
  trainOptions
}: Readonly<{
  trainId: string;
  onTrainIdChange: (value: string) => void;
  category: EventCategory | "all";
  onCategoryChange: (value: EventCategory | "all") => void;
  trainOptions: Array<{ id: string; label: string; code: string }>;
}>) {
  return (
    <div className="grid gap-3 rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-panel md:grid-cols-2">
      <label className="space-y-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Train</span>
        <select
          value={trainId}
          onChange={(event) => onTrainIdChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All visible trains</option>
          {trainOptions.map((train) => (
            <option key={train.id} value={train.id}>
              {train.code} - {train.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Category</span>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as EventCategory | "all")}
          className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All categories</option>
          {EVENT_CATEGORY_VALUES.map((value) => (
            <option key={value} value={value}>
              {eventCategoryLabels[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
