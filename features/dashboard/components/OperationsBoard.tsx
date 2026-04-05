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
        eyebrow="Admin focus"
        title="Run approvals, departures, and fleet exceptions from one desk"
        description="The admin view keeps the full network in frame. Clear the backlog first, then work any train that is blocked, disconnected, or in incident state."
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
            description: "Access requests waiting on a decision.",
            icon: ShieldCheck
          },
          {
            label: "Clearance holds",
            value: data.summary.pendingClearance,
            description: "Trains still blocked before departure.",
            icon: RouteIcon
          },
          {
            label: "Active incidents",
            value: data.summary.activeIncidents,
            description: "High-severity alerts currently unresolved.",
            icon: AlertTriangle,
            accent: "red"
          },
          {
            label: "Stale or offline",
            value: data.summary.staleOrOffline,
            description: "Linked hardware or telemetry needs attention.",
            icon: RadioTower,
            accent: "amber"
          }
        ]}
        metricsGridClassName="sm:grid-cols-2"
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
        eyebrow="Master focus"
        title="Keep managed trains staffed, inspected, and ready to move"
        description="This view is tighter than admin. It centers worker approvals, pending departures, and any managed train that needs intervention."
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
            description: "Worker requests waiting on your decision.",
            icon: ShieldCheck
          },
          {
            label: "Departure holds",
            value: data.summary.pendingClearance,
            description: "Managed trains still pending clearance.",
            icon: RouteIcon
          },
          {
            label: "Open incidents",
            value: data.summary.activeIncidents,
            description: "Critical train conditions inside your scope.",
            icon: AlertTriangle,
            accent: "red"
          },
          {
            label: "Moving trains",
            value: data.summary.movingTrains,
            description: "Managed trains currently in transit.",
            icon: TrainFront
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
        eyebrow="Worker focus"
        title="Keep the screen tight around your current train work"
        description="Only the trains in your current scope stay in view here. Request access when needed, then open the exact train and keep moving."
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
            description: "Trains you can open right now.",
            icon: TrainFront
          },
          {
            label: "Request trail",
            value: data.summary.pendingRequests,
            description: "Requests still active in your queue.",
            icon: ClipboardList
          },
          {
            label: "Open warnings",
            value: data.summary.activeIncidents,
            description: "Critical issues on trains in your scope.",
            icon: AlertTriangle,
            accent: "red"
          },
          {
            label: "Offline or stale",
            value: data.summary.staleOrOffline,
            description: "Visible trains with weak telemetry freshness.",
            icon: RadioTower,
            accent: "amber"
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
    <Card className="flex h-full min-h-[22rem] flex-col border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
            <CardTitle className="font-display text-2xl font-bold">{title}</CardTitle>
          </div>
          <Link href={href} prefetch>
            <Badge variant="outline" className="gap-1">
              Open
              <ArrowRight className="h-3 w-3" />
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
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
  description,
  events
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  events: DashboardOperationsData["recentEvents"];
}>) {
  return (
    <Card className="flex h-full min-h-[22rem] flex-col border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <CardTitle className="font-display text-2xl font-bold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {events.length ? (
          <EventTimeline events={events} compact />
        ) : (
          <p className="text-sm text-muted-foreground">No recent events are available for this role right now.</p>
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
    <Card className="flex h-full min-h-[22rem] flex-col border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Current train desk</p>
        <CardTitle className="font-display text-2xl font-bold">Open only the trains in your scope</CardTitle>
        <p className="text-sm text-muted-foreground">
          Worker visibility closes after clearance or transit, so this card stays narrow and task-oriented.
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {trains.length ? (
          trains.map((train) => (
            <div key={train.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{trainStatusLabels[train.status]}</Badge>
                    <Badge variant="outline">{journeyStageLabels[train.journeyStage]}</Badge>
                    <Badge variant="outline">{clearanceStatusLabels[train.clearanceStatus]}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{train.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {train.code}
                      {train.routeName ? ` | ${train.routeName}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {telemetryFreshnessLabels[train.freshnessState]}
                      {train.reportedAt ? ` | updated ${formatRelativeTime(train.reportedAt)}` : ""}
                    </p>
                  </div>
                </div>
                <Link href={`/fleet/${train.id}` as Route} prefetch>
                  <Badge variant="outline" className="gap-1 px-3 py-2 text-xs">
                    Open
                    <ArrowRight className="h-3 w-3" />
                  </Badge>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No trains are currently visible in your work scope.</p>
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
  description,
  visibleTrains,
  movingTrains,
  links,
  metrics,
  metricsGridClassName
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  visibleTrains: number;
  movingTrains: number;
  links: Array<{ href: Route; label: string }>;
  metrics: Array<{
    label: string;
    value: number;
    description: string;
    icon: ComponentType<{ className?: string }>;
    accent?: "red" | "amber";
  }>;
  metricsGridClassName?: string;
}>) {
  return (
    <div className={balancedPairGridClassName}>
      <Card className="flex h-full flex-col border-border/60 bg-card/92 shadow-panel">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">{eyebrow}</p>
              <CardTitle className="font-display text-3xl font-bold tracking-tight">{title}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <QuickLink key={link.href} href={link.href} label={link.label} />
              ))}
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className={`grid flex-1 content-start gap-4 ${metricsGridClassName ?? "sm:grid-cols-2 xl:grid-cols-4"}`}>
          {metrics.map((metric) => (
            <SummaryTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              icon={metric.icon}
              accent={metric.accent}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col border-border/60 bg-card/92 shadow-panel">
        <CardHeader className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Operating rhythm</p>
          <CardTitle className="font-display text-2xl font-bold tracking-tight">Stay on the next meaningful move</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <PulseMetric
              label="Visible trains"
              value={visibleTrains}
              detail="Trains currently available in this role scope."
              icon={TrainFront}
            />
            <PulseMetric
              label="Recent motion"
              value={movingTrains}
              detail="Moving trains currently reported in your scope."
              icon={Activity}
              accent="emerald"
            />
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
            <p className="text-sm font-semibold text-foreground">Read the screen in this order</p>
            <div className="mt-3 space-y-3">
              <StatusLine label="1. Work the queue" detail="Handle access or departure blockers before browsing the rest of the fleet." />
              <StatusLine label="2. Check risk" detail="Open incidents and stale telemetry next, because they change train trust immediately." />
              <StatusLine label="3. Move deeper" detail="Use fleet, alerts, or access only after the top queue is under control." />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  description,
  icon: Icon,
  accent
}: Readonly<{
  label: string;
  value: number;
  description: string;
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
    <div className="flex h-full flex-col rounded-[1.5rem] border border-border/60 bg-background/65 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accentClasses}`} />
      </div>
      <p className={`mt-4 font-display text-3xl font-bold ${accent ? accentClasses : "text-foreground"}`}>{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PulseMetric({
  label,
  value,
  detail,
  icon: Icon,
  accent
}: Readonly<{
  label: string;
  value: number;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  accent?: "emerald";
}>) {
  return (
    <div className="flex h-full flex-col rounded-[1.5rem] border border-border/60 bg-background/65 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon className={accent === "emerald" ? "h-4 w-4 text-emerald-600 dark:text-emerald-300" : "h-4 w-4 text-muted-foreground"} />
      </div>
      <p className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function StatusLine({
  label,
  detail
}: Readonly<{
  label: string;
  detail: string;
}>) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-3 first:border-t-0 first:pt-0">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="max-w-[16rem] text-right text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
