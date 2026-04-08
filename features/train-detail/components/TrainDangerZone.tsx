"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, LoaderCircle, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { deleteTrainRequest } from "@/features/train-detail/services/train-client";
import type { Train } from "@/types/train";

type TrainDangerZoneProps = {
  train: Train;
  canDelete: boolean;
};

export function TrainDangerZone({ train, canDelete }: Readonly<TrainDangerZoneProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmationCode, setConfirmationCode] = useState("");

  const deleteMutation = useMutation({
    mutationFn: () => deleteTrainRequest(train.id),
    onSuccess: async () => {
      toast.success("Train removed from CargoGuardian.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fleet"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["map", "workspace"] }),
        queryClient.invalidateQueries({ queryKey: ["shell", "trains"] }),
        queryClient.invalidateQueries({ queryKey: ["alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["history"] }),
        queryClient.invalidateQueries({ queryKey: ["access", "workspace"] }),
        queryClient.removeQueries({ queryKey: ["trains", train.id] })
      ]);
      router.push("/fleet");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove train.");
    }
  });

  if (!canDelete) {
    return null;
  }

  const isConfirmed = confirmationCode.trim().toUpperCase() === train.code.toUpperCase();

  return (
    <section className="rounded-[1.75rem] border border-destructive/25 bg-destructive/5 p-5 shadow-panel">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em]">Danger zone</p>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Disconnect this train</h2>
          <p className="text-sm text-muted-foreground">
            This removes the train record, saved route, live telemetry cache, telemetry history, alerts, access requests,
            and assignments tied to <span className="font-semibold text-foreground">{train.code}</span> from CargoGuardian.
          </p>
          <p className="text-sm text-muted-foreground">
            The linked Blynk device is not deleted or modified. It stays available in Blynk for reuse or manual cleanup.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3 rounded-[1.5rem] border border-destructive/20 bg-background/80 p-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">Type {train.code} to confirm</span>
            <Input value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} placeholder={train.code} />
          </label>

          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={!isConfirmed || deleteMutation.isPending}
            onClick={() => void deleteMutation.mutateAsync()}
          >
            {deleteMutation.isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Disconnecting train...
              </>
            ) : (
              <>
                <Unplug className="h-4 w-4" />
                Disconnect from CargoGuardian
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            This is a CargoGuardian-side cleanup only. Blynk device management stays manual and separate.
          </p>
        </div>
      </div>
    </section>
  );
}
