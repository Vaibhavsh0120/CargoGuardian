"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Train } from "@/types/train";
import { ArrowRight, MapPin } from "lucide-react";

type RouteProgressCardProps = {
  train: Train;
};

export function RouteProgressCard({ train }: Readonly<RouteProgressCardProps>) {
  const hasRouteData = Boolean(train.routeName || train.origin || train.destination);

  return (
    <Card className="border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Route record</p>
        <CardTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
          Source to destination
        </CardTitle>
        {train.routeName ? (
          <p className="text-sm text-muted-foreground">{train.routeName}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Route metadata is optional here, but origin and destination still help operators orient the train.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {!hasRouteData ? (
            <p className="text-sm text-muted-foreground">
              Route metadata has not been added yet. The train can still ingest telemetry.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
            <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border/60 bg-background/60 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Origin
              </span>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span className="truncate font-medium">{train.origin ?? "Unknown"}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="size-5 text-muted-foreground opacity-50" />
            </div>

            <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border/60 bg-background/60 p-4 sm:items-end">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Destination
              </span>
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{train.destination ?? "Unknown"}</span>
                <MapPin className="size-4 text-primary opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
