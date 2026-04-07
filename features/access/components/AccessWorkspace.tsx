"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, type ComponentType, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Inbox, LoaderCircle, Mail, ShieldCheck, TrainFront, UserPlus, UserX } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { AccessRequestInbox } from "@/features/access/components/AccessRequestInbox";
import { EventTimeline } from "@/features/history/components/EventTimeline";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  type AccessGrantRecord,
  type AccessWorkspaceResponse,
  type AccessWorkspaceTrain
} from "@/types/access";
import {
  clearanceStatusLabels,
  journeyStageLabels,
  trainStatusLabels,
  type TrainStatus
} from "@/types/train";
import type { UserRole } from "@/types/user";

type ReviewRequestInput = {
  requestId: string;
  action: "approve" | "reject";
};

type GrantAccessInput = {
  trainId: string;
  userEmail: string;
  role: "master" | "worker";
};

type RevokeAccessInput = {
  assignmentId: string;
  trainId: string;
  userEmail: string;
};

type WorkspaceLayerKey =
  | "review"
  | "grant"
  | "grants"
  | "activity"
  | "request"
  | "requests"
  | "trains";

type WorkspaceLayer = {
  key: WorkspaceLayerKey;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const inputLikeClassName =
  "flex h-10 w-full rounded-xl border border-input bg-surface-low px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

const statusToneClasses: Record<TrainStatus, string> = {
  active: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  idle: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
  warning: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  critical: "bg-red-500/12 text-red-700 dark:text-red-300",
  offline: "bg-red-500/12 text-red-700 dark:text-red-300"
};

async function fetchAccessWorkspace(): Promise<AccessWorkspaceResponse> {
  const response = await fetch("/api/trains/access/workspace", {
    cache: "no-store"
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? "Failed to load access workspace.");
  }

  return response.json() as Promise<AccessWorkspaceResponse>;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return payload as T;
}

export function AccessWorkspace() {
  const queryClient = useQueryClient();
  const [activeLayer, setActiveLayer] = useState<WorkspaceLayerKey>("review");
  const [trainId, setTrainId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [grantRole, setGrantRole] = useState<"master" | "worker">("worker");
  const [trainCode, setTrainCode] = useState("");
  const [reason, setReason] = useState("");

  const workspaceQuery = useQuery({
    queryKey: ["access", "workspace"],
    queryFn: fetchAccessWorkspace,
    staleTime: 15_000
  });

  useLiveRefresh({
    queryKeys: [["access", "workspace"]],
    enabled: true
  });

  const workspace = workspaceQuery.data;
  const viewerRole = workspace?.viewerRole ?? "worker";
  const reviewerMode = viewerRole === "admin" || viewerRole === "master";
  const canCreateTrain = viewerRole === "admin";
  const manageableTrains = workspace?.manageableTrains ?? [];
  const requests = workspace?.requests ?? [];
  const assignments = workspace?.assignments ?? [];
  const recentActivity = workspace?.recentActivity ?? [];
  const visibleTrains = workspace?.visibleTrains ?? [];
  const pendingRequests = reviewerMode ? requests.filter((request) => request.status === "pending") : requests;
  const selectedTrainId =
    manageableTrains.some((train) => train.id === trainId) ? trainId : (manageableTrains[0]?.id ?? "");
  const layers = getWorkspaceLayers(viewerRole);
  const resolvedActiveLayer = layers.some((layer) => layer.key === activeLayer) ? activeLayer : (layers[0]?.key ?? "request");

  async function invalidateWorkspace() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["access", "workspace"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["shell", "trains"] }),
      queryClient.invalidateQueries({ queryKey: ["fleet"] }),
      queryClient.invalidateQueries({ queryKey: ["history"] })
    ]);
  }

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, action }: ReviewRequestInput) =>
      postJson<{ success: true }>(`/api/trains/access/${requestId}/${action}`, action === "reject" ? {} : undefined),
    onSuccess: async (_data, variables) => {
      toast.success(variables.action === "approve" ? "Request approved." : "Request rejected.");
      await invalidateWorkspace();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not review request.");
    }
  });

  const grantMutation = useMutation({
    mutationFn: ({ trainId: nextTrainId, userEmail: nextUserEmail, role }: GrantAccessInput) => {
      if (viewerRole === "master") {
        return postJson<{ success: true }>(`/api/trains/${nextTrainId}/delegate`, {
          trainId: nextTrainId,
          userEmail: nextUserEmail
        });
      }

      return postJson<{ success: true }>("/api/trains/access/grant", {
        trainId: nextTrainId,
        userEmail: nextUserEmail,
        role
      });
    },
    onSuccess: async () => {
      setUserEmail("");
      if (viewerRole === "admin") {
        setGrantRole("worker");
      }
      toast.success(viewerRole === "master" ? "Worker access delegated." : "Access granted.");
      await invalidateWorkspace();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not grant access.");
    }
  });

  const revokeMutation = useMutation({
    mutationFn: ({ trainId: nextTrainId, userEmail: nextUserEmail }: RevokeAccessInput) =>
      postJson<{ success: true }>("/api/trains/access/revoke", {
        trainId: nextTrainId,
        userEmail: nextUserEmail
      }),
    onSuccess: async () => {
      toast.success("Access revoked.");
      await invalidateWorkspace();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not revoke access.");
    }
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      postJson<{ success: true }>("/api/trains/access/request", {
        trainCode: trainCode.trim().toUpperCase(),
        reason: reason.trim()
      }),
    onSuccess: async () => {
      setTrainCode("");
      setReason("");
      toast.success("Access request submitted.");
      await invalidateWorkspace();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not submit access request.");
    }
  });

  function submitGrant() {
    if (!selectedTrainId || !userEmail.trim()) {
      toast.error("Select a train and enter a teammate email.");
      return;
    }

    grantMutation.mutate({
      trainId: selectedTrainId,
      userEmail: userEmail.trim().toLowerCase(),
      role: viewerRole === "admin" ? grantRole : "worker"
    });
  }

  function submitRequest() {
    if (!trainCode.trim() || reason.trim().length < 10) {
      toast.error("Enter a train code and a reason of at least 10 characters.");
      return;
    }

    requestMutation.mutate();
  }

  if (workspaceQuery.isLoading) {
    return <LoadingPanel />;
  }

  if (workspaceQuery.isError || !workspace) {
    return (
      <ErrorState
        title="Access workspace is unavailable"
        description="CargoGuardian could not load train access requests, grants, or role responsibilities right now."
        onAction={() => {
          void workspaceQuery.refetch();
        }}
      />
    );
  }

  const activeContent = (() => {
    switch (resolvedActiveLayer) {
      case "review":
        return (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Pending inbox"
              title="Requests waiting on you"
              description="Approve or reject worker requests for trains that are inside your decision scope."
            />
            <AccessRequestInbox
              requests={pendingRequests}
              mode="reviewer"
              activeRequestId={reviewMutation.isPending ? reviewMutation.variables?.requestId ?? null : null}
              onApprove={(request) => reviewMutation.mutate({ requestId: request.id, action: "approve" })}
              onReject={(request) => reviewMutation.mutate({ requestId: request.id, action: "reject" })}
            />
          </div>
        );
      case "grant":
        return (
          <GrantLayer
            canCreateTrain={canCreateTrain}
            viewerRole={viewerRole}
            manageableTrains={manageableTrains}
            selectedTrainId={selectedTrainId}
            onTrainChange={setTrainId}
            userEmail={userEmail}
            onUserEmailChange={setUserEmail}
            grantRole={grantRole}
            onGrantRoleChange={setGrantRole}
            isPending={grantMutation.isPending}
            onSubmit={submitGrant}
          />
        );
      case "grants":
        return (
          <AccessGrantPanel
            assignments={assignments}
            viewerRole={viewerRole}
            activeAssignmentId={revokeMutation.isPending ? revokeMutation.variables?.assignmentId ?? null : null}
            onRevoke={(assignment) =>
              revokeMutation.mutate({
                assignmentId: assignment.id,
                trainId: assignment.trainId,
                userEmail: assignment.userEmail ?? ""
              })
            }
          />
        );
      case "activity":
        return (
          <div className="space-y-4">
            <SectionHeading
              eyebrow="Recent access activity"
              title="Approval and grant trail"
              description="Review the latest access requests, approvals, rejections, grants, delegations, and revocations."
            />
            {recentActivity.length ? (
              <EventTimeline events={recentActivity} compact />
            ) : (
              <EmptyState
                title="No access activity yet"
                description="As train visibility is requested, approved, or revoked, those events will appear here."
                icon={Inbox}
                className="border-none bg-transparent p-0 shadow-none"
              />
            )}
          </div>
        );
      case "requests":
        return (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Your request status"
              title="Request trail"
              description="Track each request and wait for the approving admin or master."
            />
            <AccessRequestInbox requests={requests} mode="worker" />
          </div>
        );
      case "trains":
        return <VisibleTrainsPanel trains={visibleTrains} />;
      case "request":
      default:
        return (
          <RequestFormLayer
            trainCode={trainCode}
            onTrainCodeChange={setTrainCode}
            reason={reason}
            onReasonChange={setReason}
            isPending={requestMutation.isPending}
            onSubmit={submitRequest}
          />
        );
    }
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access control"
        title={getAccessTitle(viewerRole)}
        description={getAccessDescription(viewerRole)}
        actions={
          canCreateTrain ? (
            <Link href={"/trains/new" as Route} prefetch className={buttonVariants()}>
              <TrainFront className="h-4 w-4" />
              Add train
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label={reviewerMode ? "Pending reviews" : "Pending requests"}
          value={workspace.summary.pendingRequests}
          description={reviewerMode ? "Requests waiting for your decision." : "Your requests still awaiting review."}
        />
        <SummaryCard
          label={reviewerMode ? "Active grants" : "Visible trains"}
          value={reviewerMode ? workspace.summary.activeAssignments : workspace.summary.visibleTrains}
          description={reviewerMode ? "Active lower-role access you can audit." : "Trains you can open right now."}
        />
        <SummaryCard
          label={reviewerMode ? "Managed trains" : "Request history"}
          value={reviewerMode ? workspace.summary.manageableTrains : requests.length}
          description={
            reviewerMode ? "Train scope available for access decisions." : "Submitted requests across pending and decided states."
          }
        />
      </div>

      <LayerSelector layers={layers} activeLayer={resolvedActiveLayer} onSelect={setActiveLayer} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_22rem]">
        <section className="rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-panel">{activeContent}</section>

        <aside className="space-y-4">
          <RoleGuideCard viewerRole={viewerRole} />
          {reviewerMode ? (
            <ScopePreviewCard trains={manageableTrains} />
          ) : (
            <RequestGuideCard
              pendingRequests={workspace.summary.pendingRequests}
              visibleTrains={workspace.summary.visibleTrains}
            />
          )}
          <ActivityPreviewCard
            events={recentActivity}
            onOpenActivity={layers.some((layer) => layer.key === "activity") ? () => setActiveLayer("activity") : undefined}
          />
        </aside>
      </div>
    </div>
  );
}

function getAccessTitle(viewerRole: UserRole) {
  if (viewerRole === "admin") {
    return "Manage access";
  }

  if (viewerRole === "master") {
    return "Approve access";
  }

  return "Request access";
}

function getAccessDescription(viewerRole: UserRole) {
  if (viewerRole === "admin") {
    return "Review incoming access requests, grant train visibility, and audit active assignments across the network.";
  }

  if (viewerRole === "master") {
    return "Approve worker requests for your managed trains and delegate pre-clearance access when operations require it.";
  }

  return "Request train visibility before clearance and track the latest decision updates for your work scope.";
}

function getWorkspaceLayers(viewerRole: UserRole): WorkspaceLayer[] {
  if (viewerRole === "admin") {
    return [
      { key: "review", label: "Review requests", description: "Approve or reject pending worker requests.", icon: Inbox },
      { key: "grant", label: "Grant access", description: "Assign train visibility by teammate email.", icon: UserPlus },
      { key: "grants", label: "Active grants", description: "Audit current access and revoke when needed.", icon: ShieldCheck },
      { key: "activity", label: "Activity", description: "See the recent access decision trail.", icon: Activity }
    ];
  }

  if (viewerRole === "master") {
    return [
      { key: "review", label: "Review requests", description: "Approve or reject workers for managed trains.", icon: Inbox },
      { key: "grant", label: "Delegate workers", description: "Hand worker visibility down by email.", icon: UserPlus },
      { key: "grants", label: "Worker grants", description: "See active worker access in your scope.", icon: ShieldCheck },
      { key: "activity", label: "Activity", description: "Follow recent approvals and delegations.", icon: Activity }
    ];
  }

  return [
    { key: "request", label: "Request access", description: "Submit a new train code and reason.", icon: Mail },
    { key: "requests", label: "My requests", description: "Track approvals and rejections.", icon: Inbox },
    { key: "trains", label: "Visible trains", description: "Open only the trains you can work on now.", icon: TrainFront }
  ];
}

function LayerSelector({
  layers,
  activeLayer,
  onSelect
}: Readonly<{
  layers: WorkspaceLayer[];
  activeLayer: WorkspaceLayerKey;
  onSelect: (layer: WorkspaceLayerKey) => void;
}>) {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
      {layers.map((layer) => {
        const Icon = layer.icon;
        const active = layer.key === activeLayer;

        return (
          <button
            key={layer.key}
            type="button"
            onClick={() => onSelect(layer.key)}
            className={cn(
              "rounded-[1.5rem] border p-4 text-left shadow-panel transition-colors",
              active ? "border-primary/35 bg-primary/6" : "border-border/60 bg-card/90 hover:bg-card"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border",
                  active ? "border-primary/25 bg-primary/10 text-primary" : "border-border/60 bg-background/70 text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <Badge variant={active ? "secondary" : "outline"}>{active ? "Open" : "Layer"}</Badge>
            </div>
            <div className="mt-4 space-y-1">
              <p className="font-semibold text-foreground">{layer.label}</p>
              <p className="text-sm text-muted-foreground">{layer.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RoleGuideCard({ viewerRole }: Readonly<{ viewerRole: UserRole }>) {
  const copy =
    viewerRole === "admin"
      ? {
          title: "Admin lane",
          body: "Create trains, assign master or worker visibility by email, and keep the entire access map auditable."
        }
      : viewerRole === "master"
        ? {
            title: "Master lane",
            body: "Approve worker requests only for trains you manage, then delegate or revoke worker access as operations shift."
          }
        : {
            title: "Worker lane",
            body: "Use the train code provided by dispatch, explain the task, then work only from the trains that stay visible after approval."
          };

  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Role guide</p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">{copy.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
    </div>
  );
}

function ScopePreviewCard({ trains }: Readonly<{ trains: AccessWorkspaceTrain[] }>) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Train scope</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">Managed trains</h2>
        </div>
        <Badge variant="outline">{trains.length}</Badge>
      </div>
      {trains.length ? (
        <div className="mt-4 space-y-3">
          {trains.slice(0, 4).map((train) => (
            <TrainScopeCard key={train.id} train={train} />
          ))}
          {trains.length > 4 ? <p className="text-xs text-muted-foreground">Showing 4 of {trains.length} trains.</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No trains are currently in your access-decision scope.</p>
      )}
    </div>
  );
}

function RequestGuideCard({
  pendingRequests,
  visibleTrains
}: Readonly<{
  pendingRequests: number;
  visibleTrains: number;
}>) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Request checklist</p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">Work this lane cleanly</h2>
      <div className="mt-4 space-y-3 text-sm text-muted-foreground">
        <p>Use the exact train code from dispatch or your supervisor.</p>
        <p>Explain the pre-departure job clearly so approval can happen without extra follow-up.</p>
        <p>{pendingRequests} request(s) are still open and {visibleTrains} train(s) are currently visible to you.</p>
      </div>
    </div>
  );
}

function ActivityPreviewCard({
  events,
  onOpenActivity
}: Readonly<{
  events: AccessWorkspaceResponse["recentActivity"];
  onOpenActivity?: () => void;
}>) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Recent activity</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">Decision trail</h2>
        </div>
        {onOpenActivity ? (
          <Button type="button" variant="outline" size="sm" onClick={onOpenActivity}>
            Open
          </Button>
        ) : null}
      </div>
      {events.length ? (
        <div className="mt-4 space-y-3">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="rounded-2xl border border-border/60 bg-background/60 p-3">
              <p className="font-semibold text-foreground">{event.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(event.createdAt)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Access requests, approvals, and revocations will appear here.</p>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description
}: Readonly<{
  label: string;
  value: number;
  description: string;
}>) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-4xl font-extrabold tracking-tight text-foreground">{value}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children
}: Readonly<{
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}>) {
  return (
    <label className="block space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {required ? <span className="text-xs font-medium uppercase tracking-wide text-secondary">Required</span> : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </label>
  );
}

function GrantLayer({
  canCreateTrain,
  viewerRole,
  manageableTrains,
  selectedTrainId,
  onTrainChange,
  userEmail,
  onUserEmailChange,
  grantRole,
  onGrantRoleChange,
  isPending,
  onSubmit
}: Readonly<{
  canCreateTrain: boolean;
  viewerRole: UserRole;
  manageableTrains: AccessWorkspaceTrain[];
  selectedTrainId: string;
  onTrainChange: (trainId: string) => void;
  userEmail: string;
  onUserEmailChange: (value: string) => void;
  grantRole: "master" | "worker";
  onGrantRoleChange: (role: "master" | "worker") => void;
  isPending: boolean;
  onSubmit: () => void;
}>) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow={viewerRole === "admin" ? "Grant visibility" : "Delegate worker access"}
        title={viewerRole === "admin" ? "Assign train access by email" : "Hand off worker access by email"}
        description={
          viewerRole === "admin"
            ? "Only admins can create trains and assign master or worker visibility. Use the teammate's account email so the right user receives train access."
            : "Masters can only delegate worker visibility on trains they manage. Admins still control train creation and master-level access."
        }
      />

      {manageableTrains.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Train" required>
              <select value={selectedTrainId} onChange={(event) => onTrainChange(event.target.value)} className={inputLikeClassName}>
                {manageableTrains.map((train) => (
                  <option key={train.id} value={train.id}>
                    {train.code} - {train.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Teammate email" required>
              <Input
                type="email"
                value={userEmail}
                onChange={(event) => onUserEmailChange(event.target.value)}
                placeholder="operator@cargoguardian.com"
              />
            </Field>
          </div>

          {viewerRole === "admin" ? (
            <Field label="Access role" required>
              <select
                value={grantRole}
                onChange={(event) => onGrantRoleChange(event.target.value as "master" | "worker")}
                className={inputLikeClassName}
              >
                <option value="worker">Worker</option>
                <option value="master">Master</option>
              </select>
            </Field>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {viewerRole === "admin" ? "Grant access" : "Delegate worker access"}
                </>
              )}
            </Button>
            <Badge variant="outline">Only admins add trains</Badge>
          </div>

          <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Your train scope</p>
                <p className="text-xs text-muted-foreground">
                  These trains are currently available for your access decisions.
                </p>
              </div>
              <Badge variant="outline">{manageableTrains.length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {manageableTrains.slice(0, 6).map((train) => (
                <TrainScopeCard key={train.id} train={train} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="No trains available for access decisions"
          description={
            viewerRole === "admin"
              ? "Create a train first, then return here to assign visibility by email."
              : "You do not currently manage any trains. Ask an admin to assign you to a train before delegating worker access."
          }
          icon={TrainFront}
          className="border-none bg-transparent p-0 shadow-none text-left [&_div]:items-start [&_div]:text-left"
          actionHref={canCreateTrain ? ("/trains/new" as Route) : undefined}
          actionLabel={canCreateTrain ? "Add train" : undefined}
        />
      )}
    </div>
  );
}

function RequestFormLayer({
  trainCode,
  onTrainCodeChange,
  reason,
  onReasonChange,
  isPending,
  onSubmit
}: Readonly<{
  trainCode: string;
  onTrainCodeChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  isPending: boolean;
  onSubmit: () => void;
}>) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Request visibility"
        title="Ask for train access"
        description="Use the train code your dispatcher or supervisor gave you. Requests stay tied to your email so reviewers can approve the right account."
      />

      <Field label="Train code" required>
        <Input value={trainCode} onChange={(event) => onTrainCodeChange(event.target.value.toUpperCase())} placeholder="CG-DEMO-01" />
      </Field>

      <Field label="Reason" hint="Explain the job, inspection, or loading task that needs this train." required>
        <textarea
          rows={5}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          className={cn(inputLikeClassName, "h-auto resize-y py-3")}
          placeholder="I need pre-departure access for axle inspection and cargo verification."
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Submit request
            </>
          )}
        </Button>
        <Badge variant="outline">Only admins add trains</Badge>
      </div>
    </div>
  );
}

function TrainScopeCard({ train }: Readonly<{ train: AccessWorkspaceTrain }>) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={statusToneClasses[train.status]}>{trainStatusLabels[train.status]}</Badge>
        <Badge variant="outline">{journeyStageLabels[train.journeyStage]}</Badge>
      </div>
      <div className="mt-3 space-y-1">
        <p className="font-semibold text-foreground">{train.label}</p>
        <p className="text-sm text-muted-foreground">{train.code}</p>
      </div>
    </div>
  );
}

function AccessGrantPanel({
  assignments,
  viewerRole,
  activeAssignmentId,
  onRevoke
}: Readonly<{
  assignments: AccessGrantRecord[];
  viewerRole: UserRole;
  activeAssignmentId: string | null;
  onRevoke: (assignment: AccessGrantRecord) => void;
}>) {
  if (!assignments.length) {
    return (
      <EmptyState
        title="No active grants in scope"
        description={
          viewerRole === "admin"
            ? "Grants to masters and workers will appear here once train visibility has been assigned."
            : "Worker delegations you create will appear here, including the email and train they cover."
        }
        icon={UserPlus}
        className="border-none bg-transparent p-0 shadow-none"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Active grants</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Current train visibility</h2>
        <p className="text-sm text-muted-foreground">
          Review who currently has train access, when it was granted, and whether you can revoke it.
        </p>
      </div>

      <div className="space-y-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{assignment.trainCode ?? assignment.trainId}</Badge>
                  <Badge variant="outline">{assignment.role}</Badge>
                  {assignment.canRevoke ? (
                    <Badge variant="secondary">You can revoke</Badge>
                  ) : (
                    <Badge variant="outline">Read only</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {assignment.userName ?? assignment.userEmail ?? "Operator"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.userEmail ?? assignment.userId}
                    {assignment.trainLabel ? ` | ${assignment.trainLabel}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Granted {formatRelativeTime(assignment.grantedAt)} on {formatDateTime(assignment.grantedAt)}
                    {assignment.grantedByEmail ? ` | by ${assignment.grantedByEmail}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/fleet/${assignment.trainId}` as Route} prefetch className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Open train
                </Link>
                {assignment.canRevoke && assignment.userEmail ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={activeAssignmentId === assignment.id}
                    onClick={() => onRevoke(assignment)}
                  >
                    {activeAssignmentId === assignment.id ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4" />
                        Revoke
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisibleTrainsPanel({ trains }: Readonly<{ trains: AccessWorkspaceTrain[] }>) {
  if (!trains.length) {
    return (
      <EmptyState
        title="No trains currently visible"
        description="Request a train by code, or wait for your supervisor to grant access before pre-departure work begins."
        icon={ShieldCheck}
        className="border-none bg-transparent p-0 shadow-none"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Current access</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Trains you can open now</h2>
        <p className="text-sm text-muted-foreground">
          Worker visibility ends once a train is cleared or moves into transit, so use this list to focus only on current tasks.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {trains.map((train) => (
          <div key={train.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusToneClasses[train.status]}>{trainStatusLabels[train.status]}</Badge>
              <Badge variant="outline">{journeyStageLabels[train.journeyStage]}</Badge>
              <Badge variant="outline">{clearanceStatusLabels[train.clearanceStatus]}</Badge>
            </div>
            <div className="mt-3 space-y-1">
              <p className="font-semibold text-foreground">{train.label}</p>
              <p className="text-sm text-muted-foreground">{train.code}</p>
            </div>
            <div className="mt-4">
              <Link href={`/fleet/${train.id}` as Route} prefetch className={buttonVariants({ variant: "outline", size: "sm" })}>
                Open train
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
