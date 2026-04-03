import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingPanel({
  className,
  compact = false
}: Readonly<{ className?: string; compact?: boolean }>) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-panel",
        className
      )}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className={cn("grid gap-4 md:grid-cols-3", compact && "md:grid-cols-2")}>
          <Skeleton className="h-28 w-full rounded-[1.25rem]" />
          <Skeleton className="h-28 w-full rounded-[1.25rem]" />
          {!compact ? <Skeleton className="h-28 w-full rounded-[1.25rem]" /> : null}
        </div>
      </div>
    </div>
  );
}
