"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/states/EmptyState";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/date";
import { clearanceStatusLabels, type Train } from "@/types/train";
import type { TelemetrySnapshot } from "@/types/telemetry";

export function ClearanceActionPanel({
  train,
  telemetry,
  canManage
}: Readonly<{
  train: Train;
  telemetry: TelemetrySnapshot | null;
  canManage: boolean;
}>) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<"remote" | "rfid">("remote");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canClear = train.clearanceStatus !== "granted";
  const hasRfidEvidence = Boolean(telemetry?.rfidLastScan);

  async function submitClearance() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trains/${train.id}/clearance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ method })
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to grant clearance.");
      }

      toast.success("Clearance recorded.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trains", train.id] }),
        queryClient.invalidateQueries({ queryKey: ["fleet", "trains"] }),
        queryClient.invalidateQueries({ queryKey: ["telemetry", "current", train.id] }),
        queryClient.invalidateQueries({ queryKey: ["alerts", "train", train.id] }),
        queryClient.invalidateQueries({ queryKey: ["history", "train", train.id] }),
        queryClient.invalidateQueries({ queryKey: ["history"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "operations"] })
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to grant clearance.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canClear) {
    return (
      <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-6 shadow-panel">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{clearanceStatusLabels[train.clearanceStatus]}</Badge>
            {train.clearanceMethod ? <Badge variant="outline">{train.clearanceMethod}</Badge> : null}
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Clearance complete</h2>
          <p className="text-sm text-muted-foreground">
            Clearance was granted at {formatDateTime(train.clearanceGrantedAt)} by {train.clearanceGrantedBy ?? "an operator"}.
          </p>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-6 shadow-panel">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Clearance control</p>
          <h2 className="font-display text-2xl font-bold text-foreground">Awaiting master or admin approval</h2>
          <p className="text-sm text-muted-foreground">
            This train is still pending clearance. Only an authorized master or administrator can grant departure clearance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-6 shadow-panel">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Clearance control</p>
          <h2 className="font-display text-2xl font-bold text-foreground">Grant train clearance</h2>
          <p className="text-sm text-muted-foreground">
            Choose the clearance method, then CargoGuardian will update the train state and sync the hardware clearance LED.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={method === "remote" ? "default" : "outline"} onClick={() => setMethod("remote")}>
            Remote
          </Button>
          <Button variant={method === "rfid" ? "default" : "outline"} onClick={() => setMethod("rfid")}>
            RFID-backed
          </Button>
        </div>

        {method === "rfid" ? (
          hasRfidEvidence ? (
            <Alert>
              RFID evidence found at {formatDateTime(telemetry?.rfidLastScan ?? null)}{telemetry?.rfidLastTag ? ` for tag ${telemetry.rfidLastTag}.` : "."}
            </Alert>
          ) : (
            <EmptyState
              title="RFID evidence required"
              description="Switch back to remote clearance or wait for a recorded RFID scan before using the RFID-backed method."
              className="border-none bg-muted/40 p-4 text-left shadow-none"
            />
          )
        ) : null}

        <Button disabled={isSubmitting || (method === "rfid" && !hasRfidEvidence)} onClick={submitClearance}>
          {isSubmitting ? "Granting clearance..." : "Grant clearance"}
        </Button>
      </div>
    </div>
  );
}
