"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ScanLine, ShieldCheck, Wifi } from "lucide-react";

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
  const hardwareLinkLabel = train.blynkDeviceId
    ? `Device ${train.blynkDeviceId}`
    : train.blynkAuthToken
      ? "Auth token linked"
      : "No hardware link";

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
      <div className="rounded-[1.75rem] border border-emerald-500/30 bg-card/90 p-6 shadow-panel">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{clearanceStatusLabels[train.clearanceStatus]}</Badge>
            {train.clearanceMethod ? <Badge variant="outline">{train.clearanceMethod.toUpperCase()}</Badge> : null}
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-foreground">Train cleared for departure</h2>
            <p className="text-sm text-muted-foreground">
              Clearance was granted at {formatDateTime(train.clearanceGrantedAt)} by {train.clearanceGrantedBy ?? "an operator"}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusItem
              label="Clearance command"
              value="Sent"
              description="CargoGuardian already pushed the clearance LED command through the linked Blynk device."
              icon={CheckCircle2}
            />
            <StatusItem
              label="Hardware link"
              value={hardwareLinkLabel}
              description="This train remains linked to the existing ESP32/Blynk device path."
              icon={Wifi}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-6 shadow-panel">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{clearanceStatusLabels[train.clearanceStatus]}</Badge>
            <Badge variant="outline">{train.journeyStage}</Badge>
          </div>
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
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{clearanceStatusLabels[train.clearanceStatus]}</Badge>
            <Badge variant="outline">{train.journeyStage}</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Clearance control</p>
            <h2 className="font-display text-2xl font-bold text-foreground">Grant train clearance</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Approve departure when this train is ready. CargoGuardian will save the clearance state and push the linked ESP32 clearance command through Blynk.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatusItem
            label="Hardware link"
            value={hardwareLinkLabel}
            description={
              train.blynkAuthToken
                ? "The train has a server-side device credential ready for the outbound LED command."
                : "Add or restore the device credential before sending clearance."
            }
            icon={Wifi}
          />
          <StatusItem
            label="RFID evidence"
            value={hasRfidEvidence ? "Ready" : "Missing"}
            description={
              hasRfidEvidence
                ? `Last RFID scan ${formatDateTime(telemetry?.rfidLastScan ?? null)}${telemetry?.rfidLastTag ? ` for tag ${telemetry.rfidLastTag}` : ""}.`
                : "Remote clearance is still available even when no RFID scan has been recorded."
            }
            icon={ScanLine}
          />
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

        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={isSubmitting || !train.blynkAuthToken || (method === "rfid" && !hasRfidEvidence)}
          onClick={submitClearance}
        >
          <ShieldCheck className="h-4 w-4" />
          {isSubmitting ? "Granting clearance..." : "Grant clearance to train"}
        </Button>
        <p className="text-xs text-muted-foreground">
          This sends the clearance signal back to the train through the existing Blynk device link, so the ESP32 can turn on the clearance LED.
        </p>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  description,
  icon: Icon
}: Readonly<{
  label: string;
  value: string;
  description: string;
  icon: typeof Wifi;
}>) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="font-semibold text-foreground">{value}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
