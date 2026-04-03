"use client";

import Link from "next/link";
import { ArrowRight, Bell, ChartColumnIncreasing, MemoryStick, TrainFront } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrainContext } from "@/hooks/useTrainContext";
import { appRouteDefinitions } from "@/lib/constants/routes";
import { trainStatusLabels } from "@/types/train";

const readinessCards = [
  {
    title: "Shell foundation",
    description: "Desktop navigation, mobile navigation, and page framing are now standardized."
  },
  {
    title: "Operator context",
    description: "Selected train state persists across refreshes and is shared across protected routes."
  },
  {
    title: "Status surface",
    description: "System badges and operator controls are now available from every app page."
  }
];

const quickLinks = [
  {
    href: appRouteDefinitions.fleet.href,
    title: "Review fleet",
    description: "Move into fleet browsing and prepare the next train drill-down.",
    icon: TrainFront
  },
  {
    href: appRouteDefinitions.alerts.href,
    title: "Open alerts",
    description: "Use the shared shell to move into incident and exception workflows.",
    icon: Bell
  },
  {
    href: appRouteDefinitions.analytics.href,
    title: "Open analytics",
    description: "Reserve space for route intelligence and anomaly scoring panels.",
    icon: ChartColumnIncreasing
  },
  {
    href: appRouteDefinitions.devices.href,
    title: "Manage devices",
    description: "Continue toward pairing and assignment workflows once hardware inventory lands.",
    icon: MemoryStick
  }
];

export default function DashboardPage() {
  const { isError, isLoading, refresh, selectedTrain, source, trains } = useTrainContext();

  if (isLoading) {
    return <LoadingPanel />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Dashboard context could not be prepared"
        description="The protected shell loaded, but the train selector data was unavailable."
        onAction={() => {
          void refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations desk"
        title="Operations dashboard"
        description={
          selectedTrain
            ? `${selectedTrain.label} is the active workspace context. Later train detail, telemetry, and alert views will inherit this selection.`
            : "The shared shell is active. Add trains or enable demo mode to establish the default train context for the workspace."
        }
      />

      {!trains.length ? (
        <EmptyState
          title="No trains are available for the shell"
          description="The dashboard is ready, but the selector does not have any train records yet. Enable demo mode or add train documents in the next phase."
          icon={TrainFront}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card className="border-white/70 bg-card/90 shadow-panel">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">Train context ready</Badge>
                {selectedTrain ? <Badge>{trainStatusLabels[selectedTrain.status]}</Badge> : null}
                <Badge variant="outline">{source === "demo" ? "Demo source" : "Live selector path"}</Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="font-display text-3xl">
                  {selectedTrain ? selectedTrain.label : "Select a train"}
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm">
                  {selectedTrain
                    ? `${selectedTrain.code}${selectedTrain.routeName ? ` | ${selectedTrain.routeName}` : ""}`
                    : "Use the shell selector to set the train that later telemetry, alerts, and analytics pages should follow."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {readinessCards.map((item) => (
                <div key={item.title} className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                  <p className="font-display text-lg font-bold text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
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
      )}
    </div>
  );
}
