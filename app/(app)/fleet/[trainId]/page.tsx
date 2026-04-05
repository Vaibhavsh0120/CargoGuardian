"use client";

import { use } from "react";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { TrainDetailHeader } from "@/features/train-detail/components/TrainDetailHeader";
import { TelemetryGrid } from "@/features/train-detail/components/TelemetryGrid";
import { TelemetryTrendChart } from "@/features/train-detail/components/TelemetryTrendChart";
import { TrainOverviewGrid } from "@/features/train-detail/components/TrainOverviewGrid";
import { RouteProgressCard } from "@/features/train-detail/components/RouteProgressCard";
import { useTelemetry } from "@/features/train-detail/hooks/useTelemetry";
import { useTelemetryHistory } from "@/features/train-detail/hooks/useTelemetryHistory";
import { useTelemetryStream } from "@/features/train-detail/hooks/useTelemetryStream";
import { useTrain } from "@/features/train-detail/hooks/useTrain";

type TrainDetailPageProps = {
  params: Promise<{ trainId: string }>;
};

export default function TrainDetailPage({ params }: TrainDetailPageProps) {
  const { trainId } = use(params);
  const { train, isLoading, isError, refetch } = useTrain(trainId);
  const telemetryQuery = useTelemetry(trainId);
  const historyQuery = useTelemetryHistory(trainId);
  const telemetryStream = useTelemetryStream(trainId);

  if (isLoading) {
    return <LoadingPanel />;
  }

  if (isError || !train) {
    return (
      <ErrorState
        title="Train not found"
        description="The requested train could not be loaded. It may have been removed or you may not have access."
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <TrainDetailHeader train={train} />
      <TelemetryGrid
        telemetry={telemetryQuery.telemetry}
        isLoading={telemetryQuery.isLoading}
        isError={telemetryQuery.isError}
        streamMode={telemetryStream.mode}
        onRetry={() => {
          void telemetryQuery.refetch();
        }}
      />
      <TelemetryTrendChart
        history={historyQuery.history}
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
        onRetry={() => {
          void historyQuery.refetch();
        }}
      />
      <RouteProgressCard train={train} />
      <TrainOverviewGrid train={train} />
    </div>
  );
}
