import { Skeleton } from "@/components/ui/skeleton";

function SummaryCardSkeleton() {
  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-card/85 p-5 shadow-panel">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-11 rounded-2xl" />
        </div>
        <Skeleton className="h-4 w-full rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function DetailPanelSkeleton() {
  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-card/85 p-5 shadow-panel">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-7 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
        <div className="grid gap-3 pt-2">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function AppShellLoadingScreen() {
  return (
    <div className="grid gap-4">
      <div className="rounded-[2rem] border border-border/60 bg-card/85 p-6 shadow-panel">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-10 w-72 max-w-full rounded-xl" />
          <Skeleton className="h-4 max-w-2xl rounded-lg" />
          <div className="grid gap-3 pt-2 md:grid-cols-3">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <DetailPanelSkeleton />
        <DetailPanelSkeleton />
      </div>
    </div>
  );
}
