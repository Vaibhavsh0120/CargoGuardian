"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TelemetryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  badge?: ReactNode;
};

export function TelemetryCard({ title, value, description, icon: Icon, badge }: TelemetryCardProps) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </span>
          {badge}
        </div>
        <div className="space-y-1">
          <CardTitle className="font-display text-base font-bold">{title}</CardTitle>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
