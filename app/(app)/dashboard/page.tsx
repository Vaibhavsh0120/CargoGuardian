"use client";

import Link from "next/link";
import type { Route } from "next";
import { Plus, TrainFront } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardPageSkeleton } from "@/components/states/PageSkeletons";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { buttonVariants } from "@/components/ui/button";
import { useSession } from "@/features/auth/hooks/useSession";
import { DashboardTelemetryOverview } from "@/features/dashboard/components/DashboardTelemetryOverview";
import { OperationsBoard } from "@/features/dashboard/components/OperationsBoard";
import { useTrainContext } from "@/hooks/useTrainContext";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import type { DashboardOperationsData } from "@/types/dashboard";

type DashboardOperationsResponse = DashboardOperationsData & {
  fetchedAt: string;
};

async function fetchDashboardOperations(): Promise<DashboardOperationsResponse> {
  const response = await fetch("/api/dashboard/operations", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load operational dashboard data.");
  }

  return response.json() as Promise<DashboardOperationsResponse>;
}

export default function DashboardPage() {
  const { isError, isLoading, refresh, selectedTrain, trains } = useTrainContext();
  const sessionQuery = useSession();
  const operationsQuery = useQuery({
    queryKey: ["dashboard", "operations"],
    queryFn: fetchDashboardOperations,
    staleTime: 15_000,
    enabled: Boolean(sessionQuery.data?.user)
  });

  useLiveRefresh({
    queryKeys: [
      ["dashboard", "operations"],
      ["dashboard", "telemetry-overview"]
    ],
    enabled: Boolean(sessionQuery.data?.user)
  });

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Dashboard could not be loaded"
        description="The train data was unavailable. Please try again."
        onAction={() => {
          void refresh();
        }}
      />
    );
  }

  const canCreateTrain = sessionQuery.data?.user?.role === "admin";
  const userRole = sessionQuery.data?.user?.role ?? "worker";
  const dashboardCopy = getDashboardCopy(userRole, selectedTrain?.label ?? null, selectedTrain?.code ?? null);
  const showTelemetryOverview = userRole !== "worker" && trains.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={dashboardCopy.eyebrow}
        title={dashboardCopy.title}
        description={dashboardCopy.description}
        actions={
          canCreateTrain ? (
            <Link href={"/trains/new" as Route} prefetch className={buttonVariants()}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add train
            </Link>
          ) : undefined
        }
      />

      {!trains.length && canCreateTrain ? (
        <EmptyState
          title="No trains in your fleet"
          description={
            canCreateTrain
              ? "Register your first train to start monitoring cargo, telemetry, and clearance workflows."
              : "No trains are currently visible in your workspace. Request access from a master or admin if needed."
          }
          icon={TrainFront}
          actionHref={canCreateTrain ? ("/trains/new" as Route) : undefined}
          actionLabel={canCreateTrain ? "Add train" : undefined}
        />
      ) : operationsQuery.isLoading ? (
        <DashboardPageSkeleton />
      ) : operationsQuery.isError || !operationsQuery.data ? (
        <ErrorState
          title="Operational dashboard is unavailable"
          description="The action queue, incidents, or recent event feed could not be loaded."
          onAction={() => {
            void operationsQuery.refetch();
          }}
        />
      ) : (
        <>
          <OperationsBoard userRole={userRole} data={operationsQuery.data} />
          {showTelemetryOverview ? <DashboardTelemetryOverview selectedTrainId={selectedTrain?.id ?? null} /> : null}
        </>
      )}
    </div>
  );
}

function getDashboardCopy(userRole: string, selectedTrainLabel: string | null, selectedTrainCode: string | null) {
  const selectedTrainCopy =
    selectedTrainLabel && selectedTrainCode ? `${selectedTrainLabel} - ${selectedTrainCode}` : null;

  if (userRole === "admin") {
    return {
      eyebrow: "Admin desk",
      title: "Control approvals, clearance, and fleet risk",
      description: selectedTrainCopy
        ? `Monitoring ${selectedTrainCopy} while keeping access approvals, incidents, and network health in one command view.`
        : "Work the approval queue first, then clear departures, incidents, and telemetry gaps across the full fleet."
    };
  }

  if (userRole === "master") {
    return {
      eyebrow: "Master desk",
      title: "Manage worker flow and departure readiness",
      description: selectedTrainCopy
        ? `Monitoring ${selectedTrainCopy} while reviewing worker requests, clearance holds, and active train issues in your scope.`
        : "Focus on managed trains, worker access needs, and any train that cannot safely leave or continue transit."
    };
  }

  return {
    eyebrow: "Worker desk",
    title: "See only the trains you can work on",
    description: selectedTrainCopy
      ? `Monitoring ${selectedTrainCopy} with access requests, current visible trains, and the latest changes kept close to hand.`
      : "Keep the screen tight: request train access when needed, open only the trains in your scope, and track recent updates."
  };
}
