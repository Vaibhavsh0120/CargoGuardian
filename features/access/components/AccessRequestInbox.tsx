"use client";

import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/states/EmptyState";
import { Badge } from "@/components/ui/badge";
import { AccessRequestActions } from "@/features/access/components/AccessRequestActions";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { accessRequestStatusLabels, type AccessRequest } from "@/types/access";

const statusStyles: Record<AccessRequest["status"], string> = {
  pending: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  approved: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-red-500/12 text-red-700 dark:text-red-300"
};

export function AccessRequestInbox({
  requests,
  mode,
  activeRequestId,
  onApprove,
  onReject
}: Readonly<{
  requests: AccessRequest[];
  mode: "reviewer" | "worker";
  activeRequestId?: string | null;
  onApprove?: (request: AccessRequest) => void;
  onReject?: (request: AccessRequest) => void;
}>) {
  if (!requests.length) {
    return (
      <EmptyState
        title={mode === "reviewer" ? "No pending reviews" : "No access requests yet"}
        description={
          mode === "reviewer"
            ? "Pending worker requests will appear here when operators ask for train access."
            : "Submitted access requests will appear here so you can track their approval state."
        }
        icon={Inbox}
        className="border-none bg-transparent p-0 shadow-none"
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn(statusStyles[request.status])}>{accessRequestStatusLabels[request.status]}</Badge>
                <Badge variant="outline">{request.trainCode ?? request.trainId}</Badge>
                <Badge variant="outline">{request.userRole}</Badge>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {request.userName ?? request.userEmail ?? "Operator"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Requested {formatRelativeTime(request.requestedAt)} on {formatDateTime(request.requestedAt)}.
                </p>
                <p className="text-sm text-muted-foreground">{request.reason ?? "No reason provided."}</p>
                {request.status !== "pending" ? (
                  <p className="text-xs text-muted-foreground">
                    Reviewed {formatRelativeTime(request.reviewedAt)}
                    {request.rejectionReason ? ` | ${request.rejectionReason}` : ""}
                  </p>
                ) : null}
              </div>
            </div>

            {mode === "reviewer" && request.status === "pending" ? (
              <AccessRequestActions
                disabled={activeRequestId === request.id}
                onApprove={onApprove ? () => onApprove(request) : undefined}
                onReject={onReject ? () => onReject(request) : undefined}
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
