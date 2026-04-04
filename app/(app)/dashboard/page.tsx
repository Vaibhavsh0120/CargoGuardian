"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChartColumnIncreasing,
  Map,
  Plus,
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
import { useTrainContext } from "@/hooks/useTrainContext";
import { appRouteDefinitions } from "@/lib/constants/routes";
import { trainStatusLabels, type TrainSummary } from "@/types/train";

type DashboardSummaryResponse = {
  summary: TrainSummary;
  fetchedAt: string;
};

async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response = await fetch("/api/dashboard/summary", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load dashboard summary.");
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
            <SummaryCard
              label="Total"
              value={summary?.totalTrains}
              icon={TrainFront}
              loading={summaryQuery.isLoading}
            />
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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Card className="border-white/70 bg-card/90 shadow-panel">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">Train context ready</Badge>
                  {selectedTrain ? <Badge>{trainStatusLabels[selectedTrain.status]}</Badge> : null}
                </div>
                <div className="space-y-2">
                  <CardTitle className="font-display text-3xl">
                    {selectedTrain ? selectedTrain.label : "Select a train"}
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm">
                    {selectedTrain
                      ? `${selectedTrain.code}${selectedTrain.routeName ? ` | ${selectedTrain.routeName}` : ""}`
                      : "Use the selector to focus the dashboard on one train at a time."}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {selectedTrain ? (
                  <Link
                    href={`/fleet/${selectedTrain.id}` as Route}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    View train details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <Card className="h-full border-white/70 bg-card/90 shadow-panel transition-transform hover:-translate-y-0.5">
                      <CardHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                            <Icon className="h-5 w-5" />
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="font-display text-xl">{link.title}</CardTitle>
                          <CardDescription>{link.description}</CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
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
