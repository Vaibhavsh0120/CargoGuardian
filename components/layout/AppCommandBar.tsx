"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppCommandBar({
  className,
  compact = false
}: Readonly<{ className?: string; compact?: boolean }>) {
  return (
    <button
      type="button"
      disabled
      aria-label="Search is not available yet."
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/85 px-4 py-3 text-left text-sm text-muted-foreground shadow-panel transition-colors disabled:cursor-not-allowed",
        compact ? "h-12" : "h-14",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">Search trains, routes, or device IDs</span>
      {!compact ? (
        <span className="rounded-lg border border-border/70 bg-background px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Ctrl K
        </span>
      ) : null}
    </button>
  );
}
