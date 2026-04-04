"use client";

import { use } from "react";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { TrainDetailHeader } from "@/features/train-detail/components/TrainDetailHeader";
import { TrainOverviewGrid } from "@/features/train-detail/components/TrainOverviewGrid";
import { RouteProgressCard } from "@/features/train-detail/components/RouteProgressCard";
import { useTrain } from "@/features/train-detail/hooks/useTrain";

type TrainDetailPageProps = {
  params: Promise<{ trainId: string }>;
};

export default function TrainDetailPage({ params }: TrainDetailPageProps) {
  const { trainId } = use(params);
  const { train, isLoading, isError, refetch } = useTrain(trainId);

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
      <RouteProgressCard train={train} />
      <TrainOverviewGrid train={train} />
    </div>
  );
}
