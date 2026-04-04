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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Route Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {train.routeName ? (
            <div>
              <p className="text-sm font-medium text-foreground">{train.routeName}</p>
            </div>
          ) : !hasRouteData ? (
            <p className="text-sm text-muted-foreground">
              Route metadata has not been added yet. The train can still ingest telemetry.
            </p>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Origin
              </span>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span className="font-medium">{train.origin ?? "Unknown"}</span>
              </div>
            </div>

            <ArrowRight className="size-5 text-muted-foreground opacity-50" />

            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Destination
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{train.destination ?? "Unknown"}</span>
                <MapPin className="size-4 text-primary opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
