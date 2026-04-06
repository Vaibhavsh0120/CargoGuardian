import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  RadioTower,
  Route as RouteIcon,
  ShieldCheck,
  TrainFront
} from "lucide-react";
import type { ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionQueue } from "@/features/dashboard/components/ActionQueue";
import { EventTimeline } from "@/features/history/components/EventTimeline";
import { formatRelativeTime } from "@/lib/date";
import type { DashboardOperationsData, DashboardVisibleTrainItem } from "@/types/dashboard";
import { telemetryFreshnessLabels } from "@/types/telemetry";
import { clearanceStatusLabels, journeyStageLabels, trainStatusLabels } from "@/types/train";
import type { UserRole } from "@/types/user";

const balancedPairGridClassName = "grid items-stretch gap-4 xl:grid-cols-2";

export function OperationsBoard({
  userRole,
  data
}: Readonly<{
  userRole: UserRole;
  data: DashboardOperationsData;
}>) {
  if (userRole === "admin") {
    return <AdminOperationsBoard data={data} />;
  }

  if (userRole === "master") {
    return <MasterOperationsBoard data={data} />;
  }

  return <WorkerOperationsBoard data={data} />;
}

function AdminOperationsBoard({ data }: Readonly<{ data: DashboardOperationsData }>) {
  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Admin desk"
        title="Manage approvals, clearance, and incidents"
        visibleTrains={data.summary.visibleTrains}
        movingTrains={data.summary.movingTrains}
        links={[
          { href: "/access", label: "Access" },
          { href: "/alerts", label: "Alerts" },
          { href: "/fleet", label: "Fleet" }
        ]}
        metrics={[
          {
            label: "Pending reviews",
            value: data.summary.pendingRequests,
            icon: ShieldCheck
          },
          {
            label: "Clearance holds",
            value: data.summary.pendingClearance,
            icon: RouteIcon
          },
          {
            label: "Active incidents",
            value: data.summary.activeIncidents,
            icon: AlertTriangle,
            accent: "red"
          }
        ]}
      />

      <ActionQueue
        userRole="admin"
        accessRequests={data.accessRequests}
        clearanceQueue={data.clearanceQueue}
        visibleTrains={data.visibleTrains}
      />

      <div className={balancedPairGridClassName}>
        <FeedCard
          eyebrow="Active incidents"
          title="High-priority alerts"
          href="/alerts"
          emptyMessage="No critical alerts are open right now."
          items={data.activeIncidents.map((alert) => ({
            id: alert.id,
            title: alert.title,
            subtitle: `${alert.trainCode} | ${alert.status}`,
            detail: alert.description
          }))}
        />
        <FeedCard
          eyebrow="Fleet health"
          title="Stale and offline telemetry"
          href="/fleet"
          emptyMessage="Telemetry freshness is healthy across the visible fleet."
          items={data.fleetHealth.map((snapshot) => ({
            id: snapshot.trainId,
            title: snapshot.trainLabel,
            subtitle: `${snapshot.trainCode} | ${snapshot.freshnessState}`,
            detail: snapshot.reportedAt ?? "No telemetry timestamp"
          }))}
        />
      </div>

      <div className={balancedPairGridClassName}>
        <FeedCard
          eyebrow="Transit watch"
          title="Trains in motion"
          href="/fleet"
          emptyMessage="No visible train is actively moving right now."
          items={data.transitWatch.map((snapshot) => ({
            id: snapshot.trainId,
            title: snapshot.trainLabel,
            subtitle: `${snapshot.trainCode} | ${snapshot.displayWeightStatus}`,
            detail:
              snapshot.speedKmh === null
                ? "Speed unavailable"
                : `${snapshot.speedKmh.toFixed(1)} km/h | ${snapshot.gpsLat?.toFixed(3) ?? "No"} ${snapshot.gpsLng?.toFixed(3) ?? "fix"}`
          }))}
        />
        <RecentEventsCard
          eyebrow="Recent operations"
          title="Latest event trail"
          description="Access, clearance, alert, and telemetry events flow here as the network changes."
          events={data.recentEvents}
        />
      </div>
    </div>
  );
}

function MasterOperationsBoard({ data }: Readonly<{ data: DashboardOperationsData }>) {
  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Master desk"
        title="Manage trains, workers, and clearance"
        visibleTrains={data.summary.visibleTrains}
        movingTrains={data.summary.movingTrains}
        links={[
          { href: "/access", label: "Access" },
          { href: "/fleet", label: "Fleet" },
          { href: "/alerts", label: "Alerts" }
        ]}
        metrics={[
          {
            label: "Pending reviews",
            value: data.summary.pendingRequests,
            icon: ShieldCheck
          },
          {
            label: "Departure holds",
            value: data.summary.pendingClearance,
            icon: RouteIcon
          },
          {
            label: "Open incidents",
            value: data.summary.activeIncidents,
            icon: AlertTriangle,
            accent: "red"
          }
        ]}
      />

      <ActionQueue
        userRole="master"
        accessRequests={data.accessRequests}
        clearanceQueue={data.clearanceQueue}
        visibleTrains={data.visibleTrains}
      />

      <div className={balancedPairGridClassName}>
        <FeedCard
          eyebrow="Active incidents"
          title="Managed train alerts"
          href="/alerts"
          emptyMessage="No critical alerts are active on the trains you manage."
          items={data.activeIncidents.map((alert) => ({
            id: alert.id,
            title: alert.title,
            subtitle: `${alert.trainCode} | ${alert.status}`,
            detail: alert.description
          }))}
        />
        <FeedCard
          eyebrow="Transit watch"
          title="Managed trains in motion"
          href="/fleet"
          emptyMessage="No managed train is actively moving right now."
          items={data.transitWatch.map((snapshot) => ({
            id: snapshot.trainId,
            title: snapshot.trainLabel,
            subtitle: `${snapshot.trainCode} | ${snapshot.displayWeightStatus}`,
            detail:
              snapshot.speedKmh === null
                ? "Speed unavailable"
                : `${snapshot.speedKmh.toFixed(1)} km/h | ${snapshot.gpsLat?.toFixed(3) ?? "No"} ${snapshot.gpsLng?.toFixed(3) ?? "fix"}`
          }))}
        />
      </div>

      <div className={balancedPairGridClassName}>
        <FeedCard
          eyebrow="Fleet health"
          title="Managed trains needing telemetry attention"
          href="/fleet"
          emptyMessage="No managed train is stale or offline."
          items={data.fleetHealth.map((snapshot) => ({
            id: snapshot.trainId,
            title: snapshot.trainLabel,
            subtitle: `${snapshot.trainCode} | ${snapshot.freshnessState}`,
            detail: snapshot.reportedAt ?? "No telemetry timestamp"
          }))}
        />
        <RecentEventsCard
          eyebrow="Recent operations"
          title="Managed train trail"
          description="Use the recent event rail to confirm approvals, delegations, and train state changes."
          events={data.recentEvents}
        />
      </div>
    </div>
  );
}

function WorkerOperationsBoard({ data }: Readonly<{ data: DashboardOperationsData }>) {
  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Worker desk"
        title="View trains and track requests"
        visibleTrains={data.summary.visibleTrains}
        movingTrains={data.summary.movingTrains}
        links={[
          { href: "/access", label: "Access" },
          { href: "/fleet", label: "Fleet" },
          { href: "/alerts", label: "Alerts" }
        ]}
        metrics={[
          {
            label: "Visible trains",
            value: data.summary.visibleTrains,
            icon: TrainFront
          },
          {
            label: "Pending requests",
            value: data.summary.pendingRequests,
            icon: ClipboardList
          },
          {
            label: "Open warnings",
            value: data.summary.activeIncidents,
            icon: AlertTriangle,
            accent: "red"
          }
        ]}
      />

      <ActionQueue
        userRole="worker"
        accessRequests={data.accessRequests}
        clearanceQueue={data.clearanceQueue}
        visibleTrains={data.visibleTrains}
      />

      <div className={balancedPairGridClassName}>
        <VisibleTrainRail trains={data.visibleTrains} />
        <RecentEventsCard
          eyebrow="Recent changes"
          title="What changed in your work scope"
          description="This rail stays focused on the most recent approvals, train updates, and issues tied to your current visibility."
          events={data.recentEvents}
        />
      </div>
    </div>
  );
}

function FeedCard({
  eyebrow,
  title,
  href,
  items,
  emptyMessage
}: Readonly<{
  eyebrow: string;
  title: string;
  href: Route;
  items: Array<{ id: string; title: string; subtitle: string; detail: string }>;
  emptyMessage: string;
}>) {
  return (
    <Card className="flex flex-col border-border/40 bg-card/50">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{eyebrow}</p>
            <CardTitle className="font-display text-lg font-bold">{title}</CardTitle>
          </div>
          <Link href={href} prefetch className="shrink-0">
            <Badge variant="outline" className="gap-1">
              <ArrowRight className="h-3 w-3" />
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {items.length ? (
          items.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-lg border border-border/50 bg-background/40 p-2.5">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RecentEventsCard({
  eyebrow,
  title,
  events
}: Readonly<{
  eyebrow: string;
  title: string;
  events: DashboardOperationsData["recentEvents"];
}>) {
  return (
    <Card className="flex flex-col border-border/40 bg-card/50">
      <CardHeader className="space-y-1 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{eyebrow}</p>
        <CardTitle className="font-display text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {events.length ? (
          <EventTimeline events={events.slice(0, 4)} compact />
        ) : (
          <p className="text-sm text-muted-foreground">No recent events</p>
        )}
      </CardContent>
    </Card>
  );
}

function VisibleTrainRail({
  trains
}: Readonly<{
  trains: DashboardVisibleTrainItem[];
}>) {
  return (
    <Card className="flex flex-col border-border/40 bg-card/50">
      <CardHeader className="space-y-1 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Your trains</p>
        <CardTitle className="font-display text-lg font-bold">Visible trains in your scope</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {trains.length ? (
          trains.slice(0, 4).map((train) => (
            <Link key={train.id} href={`/fleet/${train.id}` as Route} prefetch className="group">
              <div className="rounded-lg border border-border/50 bg-background/40 p-2.5 transition hover:bg-background/60">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{train.label}</p>
                    <p className="text-xs text-muted-foreground">{train.code}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">{trainStatusLabels[train.status]}</Badge>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No visible trains</p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  label
}: Readonly<{
  href: Route;
  label: string;
}>) {
  return (
    <Link
      href={href}
      prefetch
      className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:bg-background"
    >
      {label}
    </Link>
  );
}

function RoleHero({
  eyebrow,
  title,
  visibleTrains,
  movingTrains,
  links,
  metrics
}: Readonly<{
  eyebrow: string;
  title: string;
  visibleTrains: number;
  movingTrains: number;
  links: Array<{ href: Route; label: string }>;
  metrics: Array<{
    label: string;
    value: number;
    icon: ComponentType<{ className?: string }>;
    accent?: "red" | "amber";
  }>;
}>) {
  return (
    <Card className="border-border/40 bg-card/50">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
            <CardTitle className="font-display text-2xl font-bold">{title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <QuickLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <SummaryTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            accent={metric.accent}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  accent
}: Readonly<{
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent?: "red" | "amber";
}>) {
  const accentClasses =
    accent === "red"
      ? "text-red-600 dark:text-red-300"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-300"
        : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accentClasses}`} />
      </div>
      <p className={`mt-3 font-display text-2xl font-bold ${accent ? accentClasses : "text-foreground"}`}>{value}</p>
    </div>
  );
}


