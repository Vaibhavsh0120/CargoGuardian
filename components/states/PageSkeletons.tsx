import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function PanelShell({
  className,
  children
}: Readonly<{
  className?: string;
  children: ReactNode;
}>) {
  return (
    <div className={cn("rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-panel", className)}>
      {children}
    </div>
  );
}

function PageHeaderSkeleton({
  showAction = false
}: Readonly<{
  showAction?: boolean;
}>) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      {showAction ? <Skeleton className="h-11 w-32 rounded-xl" /> : null}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <PanelShell className="p-5">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="mt-4 h-10 w-20" />
      <Skeleton className="mt-3 h-4 w-full max-w-[14rem]" />
    </PanelShell>
  );
}

function SectionHeadingSkeleton({
  badgeCount = 0
}: Readonly<{
  badgeCount?: number;
}>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      {badgeCount ? (
        <div className="flex gap-2">
          {Array.from({ length: badgeCount }, (_, index) => (
            <Skeleton key={`badge-${index}`} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FilterBarSkeleton({
  count = 2
}: Readonly<{
  count?: number;
}>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={`filter-${index}`} className="h-11 w-full rounded-xl" />
      ))}
    </div>
  );
}

function TableRowsSkeleton({
  count = 6,
  className
}: Readonly<{
  count?: number;
  className?: string;
}>) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={`row-${index}`} className="rounded-2xl border border-border/60 bg-background/60 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedCardSkeleton({
  rows = 3
}: Readonly<{
  rows?: number;
}>) {
  return (
    <PanelShell className="flex h-full flex-col">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-7 w-48 max-w-full" />
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={`feed-${index}`} className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-48 max-w-full" />
            <Skeleton className="mt-3 h-4 w-full max-w-[18rem]" />
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function MetricTileSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-8 w-28 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-[14rem]" />
    </div>
  );
}

export function DashboardTelemetryOverviewSkeleton() {
  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-8 w-60 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <StatCardSkeleton key={`telemetry-stat-${index}`} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PanelShell className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-9 w-56 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <MetricTileSkeleton key={`focus-metric-${index}`} />
            ))}
          </div>
        </PanelShell>

        <PanelShell className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-7 w-48 max-w-full" />
          </div>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`visible-train-${index}`} className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </PanelShell>
      </div>
    </section>
  );
}

export function TelemetryGridSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-8 w-64 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <MetricTileSkeleton key={`telemetry-card-${index}`} />
        ))}
      </div>
    </section>
  );
}

export function TelemetryTrendChartSkeleton() {
  return (
    <PanelShell>
      <div className="space-y-3">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-8 w-56 max-w-full" />
      </div>
      <Skeleton className="mt-6 h-[320px] w-full rounded-[1.5rem]" />
    </PanelShell>
  );
}

export function AlertSplitPanelSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <PanelShell className="space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-8 w-52 max-w-full" />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`alert-row-${index}`} className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-5 w-40 max-w-full" />
            <Skeleton className="mt-2 h-4 w-full max-w-[18rem]" />
          </div>
        ))}
      </PanelShell>

      <PanelShell className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-24 w-full rounded-[1.5rem]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </PanelShell>
    </div>
  );
}

export function TimelinePanelSkeleton() {
  return (
    <PanelShell className="space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-8 w-60 max-w-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={`event-${index}`} className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <Skeleton className="h-5 w-48 max-w-full" />
            <Skeleton className="mt-2 h-4 w-full max-w-[20rem]" />
            <Skeleton className="mt-3 h-3 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export function MapCanvasSkeleton() {
  return (
    <div className="h-[26rem] w-full rounded-[1.75rem] border border-border/60 bg-[linear-gradient(135deg,hsl(var(--surface-low))_0%,hsl(var(--background))_100%)] p-4">
      <div className="grid h-full gap-3">
        <Skeleton className="h-full w-full rounded-[1.5rem]" />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showAction />
      <PanelShell className="space-y-5">
        <SectionHeadingSkeleton />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <MetricTileSkeleton key={`dashboard-hero-${index}`} />
          ))}
        </div>
      </PanelShell>
      <PanelShell className="space-y-4">
        <SectionHeadingSkeleton />
        <TableRowsSkeleton count={3} />
      </PanelShell>
      <div className="grid gap-4 xl:grid-cols-2">
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </div>
      <DashboardTelemetryOverviewSkeleton />
    </div>
  );
}

export function FleetPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showAction />
      <FilterBarSkeleton />
      <PanelShell className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <TableRowsSkeleton />
      </PanelShell>
    </div>
  );
}

export function AlertsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <AlertSplitPanelSkeleton />
    </div>
  );
}

export function AccessPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showAction />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <PanelShell key={`layer-${index}`} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-36 max-w-full" />
            <Skeleton className="h-4 w-full max-w-[15rem]" />
          </PanelShell>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_22rem]">
        <PanelShell className="space-y-4">
          <SectionHeadingSkeleton />
          <TableRowsSkeleton count={4} />
        </PanelShell>
        <div className="space-y-4">
          <FeedCardSkeleton rows={2} />
          <FeedCardSkeleton rows={2} />
          <FeedCardSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}

export function MapPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <PanelShell className="space-y-4">
          <SectionHeadingSkeleton badgeCount={2} />
          <MapCanvasSkeleton />
        </PanelShell>
        <div className="space-y-4">
          <FeedCardSkeleton rows={4} />
          <FeedCardSkeleton rows={3} />
          <FeedCardSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}

export function TrainDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <PanelShell className="space-y-5">
        <Skeleton className="h-3 w-20 rounded-full" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] xl:items-end">
          <div className="space-y-3">
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="h-4 w-full max-w-[28rem]" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <MetricTileSkeleton key={`train-header-${index}`} />
            ))}
          </div>
        </div>
      </PanelShell>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_24rem]">
        <div className="space-y-4">
          <TelemetryGridSkeleton />
          <TelemetryTrendChartSkeleton />
        </div>
        <div className="space-y-4">
          <FeedCardSkeleton rows={3} />
          <FeedCardSkeleton rows={3} />
          <FeedCardSkeleton rows={2} />
        </div>
      </div>
      <AlertSplitPanelSkeleton />
      <TimelinePanelSkeleton />
      <PanelShell className="space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-8 w-40 max-w-full" />
          <Skeleton className="h-4 w-full max-w-[30rem]" />
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </PanelShell>
    </div>
  );
}
