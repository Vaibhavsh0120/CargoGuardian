"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChartColumnIncreasing,
  ChevronRight,
  ClipboardList,
  Map,
  Plus,
  ShieldCheck,
  TrainFront,
  Wifi,
  WifiOff
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/hooks/useSession";
import { DashboardTelemetryOverview } from "@/features/dashboard/components/DashboardTelemetryOverview";
import { useTrainContext } from "@/hooks/useTrainContext";
import { appRouteDefinitions } from "@/lib/constants/routes";
import { trainStatusLabels, type TrainSelectorItem, type TrainSummary } from "@/types/train";

type DashboardSummaryResponse = {
  summary: TrainSummary;
  fetchedAt: string;
};

async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response = await fetch("/api/dashboard/summary", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load dashboard summary.");
  }
  return response.json() as Promise<DashboardSummaryResponse>;
}

const quickLinks = [
  {
    href: appRouteDefinitions.fleet.href,
    title: "Review fleet",
    description: "Browse your trains, check status, and drill into train details.",
    icon: TrainFront
  },
  {
    href: appRouteDefinitions.alerts.href,
    title: "Open alerts",
    description: "Monitor active alerts and incident workflows.",
    icon: Bell
  },
  {
    href: appRouteDefinitions.analytics.href,
    title: "Open analytics",
    description: "View analytics insights and anomaly scoring panels.",
    icon: ChartColumnIncreasing
  },
  {
    href: appRouteDefinitions.map.href,
    title: "Open map",
    description: "View train routes and live GPS tracking.",
    icon: Map
  }
];

export default function DashboardPage() {
  const { isError, isLoading, refresh, selectedTrain, trains } = useTrainContext();
  const sessionQuery = useSession();
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
    staleTime: 60_000
  });

  if (isLoading) {
    return <LoadingPanel />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Dashboard could not be loaded"
        description="The train data was unavailable. Please try again."
        onAction={() => {
          void refresh();
        }}
      />
    );
  }

  const summary = summaryQuery.data?.summary;
  const canCreateTrain = sessionQuery.data?.user?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations desk"
        title="Operations dashboard"
        description={
          selectedTrain
            ? `Monitoring ${selectedTrain.label} - ${selectedTrain.code}.`
            : "Select a train from your fleet to review its current operational state."
        }
        actions={
          canCreateTrain ? (
            <Link href={"/trains/new" as Route} className={buttonVariants()}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add train
            </Link>
          ) : undefined
        }
      />

      {!trains.length ? (
        <EmptyState
          title="No trains in your fleet"
          description={
            canCreateTrain
              ? "Register your first train to start monitoring cargo and telemetry."
              : "No trains are currently visible in your workspace. Request access from a master or admin if needed."
          }
          icon={TrainFront}
          actionHref={canCreateTrain ? ("/trains/new" as Route) : undefined}
          actionLabel={canCreateTrain ? "Add train" : undefined}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Total" value={summary?.totalTrains} icon={TrainFront} loading={summaryQuery.isLoading} />
            <SummaryCard
              label="Active"
              value={summary?.activeTrains}
              icon={Wifi}
              loading={summaryQuery.isLoading}
              accent="emerald"
            />
            <SummaryCard
              label="Warning"
              value={summary?.warningTrains}
              icon={AlertTriangle}
              loading={summaryQuery.isLoading}
              accent="amber"
            />
            <SummaryCard
              label="Critical"
              value={summary?.criticalTrains}
              icon={Bell}
              loading={summaryQuery.isLoading}
              accent="red"
            />
            <SummaryCard
              label="Offline"
              value={summary?.offlineTrains}
              icon={WifiOff}
              loading={summaryQuery.isLoading}
              accent="zinc"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <SelectedTrainPanel
              selectedTrain={selectedTrain}
              visibleTrainCount={trains.length}
              summaryLoading={summaryQuery.isLoading}
            />
            <OperationsShortcuts />
          </div>

          <DashboardTelemetryOverview selectedTrainId={selectedTrain?.id ?? null} />
        </>
      )}
    </div>
  );
}

function SelectedTrainPanel({
  selectedTrain,
  visibleTrainCount,
  summaryLoading
}: {
  selectedTrain: TrainSelectorItem | null;
  visibleTrainCount: number;
  summaryLoading: boolean;
}) {
  return (
    <Card className="flex h-full flex-col border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Selected train</Badge>
          {selectedTrain ? <Badge>{trainStatusLabels[selectedTrain.status]}</Badge> : null}
          <Badge variant="outline">{summaryLoading ? "Syncing summary" : `${visibleTrainCount} visible trains`}</Badge>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="font-display text-2xl sm:text-3xl">
              {selectedTrain ? selectedTrain.label : "Select a train"}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm">
              {selectedTrain
                ? "Use this train as the current operations focus for telemetry review, clearance, and movement tracking."
                : "Pick one train from the top selector to make the dashboard focus more useful."}
            </CardDescription>
          </div>
          {selectedTrain ? (
            <Link href={`/fleet/${selectedTrain.id}` as Route} className={buttonVariants()}>
              View train details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <Link href={appRouteDefinitions.fleet.href} className={buttonVariants({ variant: "outline" })}>
              Open fleet
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ContextMetric label="Train code" value={selectedTrain?.code ?? "Not selected"} icon={TrainFront} />
          <ContextMetric
            label="Status"
            value={selectedTrain ? trainStatusLabels[selectedTrain.status] : "Pending"}
            icon={ShieldCheck}
          />
          <ContextMetric label="Route" value={selectedTrain?.routeName ?? "Not assigned"} icon={Map} />
          <ContextMetric label="Workspace" value={`${visibleTrainCount} visible`} icon={ClipboardList} />
        </div>

        <div className="mt-auto rounded-3xl border border-border/60 bg-background/60 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Current focus
              </p>
              <p className="font-display text-lg font-bold text-foreground">
                {selectedTrain ? `${selectedTrain.label} is pinned for dashboard context.` : "No train is pinned yet."}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedTrain
                  ? "Telemetry cards, freshness state, and drill-down actions should be read against this train first."
                  : "Choose a train from the top selector so the operations dashboard can focus on one active context."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTrain ? (
                <Link href={`/fleet/${selectedTrain.id}` as Route} className={buttonVariants({ variant: "outline" })}>
                  Open focused train
                </Link>
              ) : null}
              <Link href={appRouteDefinitions.fleet.href} className={buttonVariants({ variant: "ghost" })}>
                Fleet list
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OperationsShortcuts() {
  return (
    <Card className="border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-2 pb-4">
        <Badge variant="outline" className="w-fit">
          Command deck
        </Badge>
        <CardTitle className="font-display text-2xl">Operations shortcuts</CardTitle>
        <CardDescription>Keep the most common fleet actions one click away from the dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <div className="group h-full rounded-3xl border border-border/60 bg-background/60 p-4 transition hover:-translate-y-0.5 hover:border-border hover:bg-background/80">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-display text-lg font-bold text-foreground">{link.title}</p>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

const accentStyles: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  zinc: "text-zinc-500 dark:text-zinc-400"
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  loading,
  accent
}: {
  label: string;
  value: number | undefined;
  icon: ComponentType<{ className?: string }>;
  loading: boolean;
  accent?: string;
}) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon
          className={`h-4 w-4 ${accent ? accentStyles[accent] ?? "text-muted-foreground" : "text-muted-foreground"}`}
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <p
            className={`font-display text-3xl font-bold ${accent ? accentStyles[accent] ?? "text-foreground" : "text-foreground"}`}
          >
            {value ?? 0}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ContextMetric({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="font-display text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
