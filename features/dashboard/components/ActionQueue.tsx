"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AccessRequestInbox } from "@/features/access/components/AccessRequestInbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/date";
import type { AccessRequest } from "@/types/access";
import type { DashboardClearanceQueueItem, DashboardVisibleTrainItem } from "@/types/dashboard";
import { telemetryFreshnessLabels } from "@/types/telemetry";
import { clearanceStatusLabels, journeyStageLabels, trainStatusLabels } from "@/types/train";
import type { UserRole } from "@/types/user";

export function ActionQueue({
  userRole,
  accessRequests,
  clearanceQueue,
  visibleTrains
}: Readonly<{
  userRole: UserRole;
  accessRequests: AccessRequest[];
  clearanceQueue: DashboardClearanceQueueItem[];
  visibleTrains: DashboardVisibleTrainItem[];
}>) {
  const queryClient = useQueryClient();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [trainCode, setTrainCode] = useState("");
  const [reason, setReason] = useState("");
  const reviewerMode = userRole === "admin" || userRole === "master";

  const visibleRequests = reviewerMode
    ? accessRequests.filter((request) => request.status === "pending")
    : accessRequests.slice(0, 6);

  async function invalidateOperationalViews() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard", "operations"] }),
      queryClient.invalidateQueries({ queryKey: ["access", "workspace"] }),
      queryClient.invalidateQueries({ queryKey: ["shell", "trains"] }),
      queryClient.invalidateQueries({ queryKey: ["fleet"] }),
      queryClient.invalidateQueries({ queryKey: ["history"] })
    ]);
  }

  async function reviewRequest(request: AccessRequest, action: "approve" | "reject") {
    setActiveRequestId(request.id);

    try {
      const response = await fetch(`/api/trains/access/${request.id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: action === "reject" ? JSON.stringify({}) : undefined
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to ${action} request.`);
      }

      toast.success(`Request ${action}d.`);
      await invalidateOperationalViews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} request.`);
    } finally {
      setActiveRequestId(null);
    }
  }

  async function submitRequest() {
    if (!trainCode.trim() || reason.trim().length < 10) {
      toast.error("Enter a train code and a reason of at least 10 characters.");
      return;
    }

    try {
      const response = await fetch("/api/trains/access/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          trainCode,
          reason
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to submit request.");
      }

      setTrainCode("");
      setReason("");
      toast.success("Access request submitted.");
      await invalidateOperationalViews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request.");
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Action queue</p>
        <h2 className="font-display text-2xl font-bold text-foreground">
          {reviewerMode ? "Pending reviews and clearance decisions" : "Your access workflow"}
        </h2>
      </div>

      {!reviewerMode ? (
        <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-panel">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Request train access</p>
              <p className="text-sm text-muted-foreground">
                Enter the train code provided by your dispatcher or supervisor and explain why you need visibility.
              </p>
            </div>
            <Input value={trainCode} onChange={(event) => setTrainCode(event.target.value)} placeholder="Train code" />
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for access"
              className="min-h-28 w-full rounded-xl border border-input bg-surface-low px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={submitRequest}>Submit access request</Button>
          </div>
        </div>
      ) : null}

      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        <div className="flex h-full flex-col rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{reviewerMode ? "Access requests" : "Your requests"}</p>
              <p className="text-sm text-muted-foreground">
                {reviewerMode
                  ? "Approve or reject worker visibility requests."
                  : "Track the current approval state of your requests."}
              </p>
            </div>
            <Badge variant="outline">{visibleRequests.length}</Badge>
          </div>

          <AccessRequestInbox
            requests={visibleRequests}
            mode={reviewerMode ? "reviewer" : "worker"}
            activeRequestId={activeRequestId}
            onApprove={reviewerMode ? (request) => void reviewRequest(request, "approve") : undefined}
            onReject={reviewerMode ? (request) => void reviewRequest(request, "reject") : undefined}
          />
        </div>

        <div className="flex h-full flex-col rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{reviewerMode ? "Clearance queue" : "Visible trains right now"}</p>
              <p className="text-sm text-muted-foreground">
                {reviewerMode
                  ? "Trains waiting for an operator decision before departure."
                  : "Only trains still inside your current work scope remain visible here."}
              </p>
            </div>
            <Badge variant="outline">{reviewerMode ? clearanceQueue.length : visibleTrains.length}</Badge>
          </div>

          {reviewerMode ? (
            <div className="space-y-3">
              {clearanceQueue.length ? (
                clearanceQueue.map((train) => (
                  <div key={train.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{train.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {train.code} | {train.routeName ?? journeyStageLabels[train.journeyStage]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last telemetry {formatRelativeTime(train.reportedAt)} | {telemetryFreshnessLabels[train.freshnessState]}
                        </p>
                      </div>
                      <Link href={`/fleet/${train.id}` as Route} prefetch>
                        <Button variant="outline" size="sm">
                          Open train
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No trains are currently waiting on clearance.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTrains.length ? (
                visibleTrains.map((train) => (
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
                        <Button variant="outline" size="sm">
                          Open train
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No trains are currently visible in your work scope.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
