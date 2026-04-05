"use client";

import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TelemetryHistoryPoint } from "@/types/telemetry";
import { Activity } from "lucide-react";

type TelemetryTrendChartProps = {
  history: TelemetryHistoryPoint[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function TelemetryTrendChart({ history, isLoading, isError, onRetry }: TelemetryTrendChartProps) {
  if (isLoading) {
    return <LoadingPanel compact />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Telemetry history could not be loaded"
        description="CargoGuardian could not load the recent telemetry history for this train."
        onAction={onRetry}
      />
    );
  }

  if (!history.length) {
    return (
      <EmptyState
        title="No telemetry history yet"
        description="The trend chart will appear after the train has posted multiple telemetry updates."
        icon={Activity}
      />
    );
  }

  const chartData = history.map((point) => ({
    time: format(new Date(point.recordedAt), "HH:mm:ss"),
    weightKg: point.weightKg,
    speedKmh: point.speedKmh
  }));

  return (
    <Card className="border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Telemetry history</p>
        <CardTitle className="font-display text-2xl font-bold tracking-tight">
          Weight and speed trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                yAxisId="weight"
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                yAxisId="speed"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  backgroundColor: "rgba(15, 23, 42, 0.92)",
                  color: "#f8fafc"
                }}
              />
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weightKg"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={false}
                connectNulls
                name="Weight (kg)"
              />
              <Line
                yAxisId="speed"
                type="monotone"
                dataKey="speedKmh"
                stroke="#ea580c"
                strokeWidth={2}
                dot={false}
                connectNulls
                name="Speed (km/h)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
