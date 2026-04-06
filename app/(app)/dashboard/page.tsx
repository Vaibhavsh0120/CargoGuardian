"use client";

import Link from "next/link";
import type { Route } from "next";
import { Plus, TrainFront } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { buttonVariants } from "@/components/ui/button";
import { useSession } from "@/features/auth/hooks/useSession";
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
    return <LoadingPanel />;
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
  const dashboardCopy = getDashboardCopy(userRole);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={dashboardCopy.eyebrow}
        title={dashboardCopy.title}
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
        <LoadingPanel />
      ) : operationsQuery.isError || !operationsQuery.data ? (
        <ErrorState
          title="Dashboard is unavailable"
          description="Could not load dashboard data. Please try again."
          onAction={() => {
            void operationsQuery.refetch();
          }}
        />
      ) : (
        <OperationsBoard userRole={userRole} data={operationsQuery.data} />
      )}
    </div>
  );
}

function getDashboardCopy(userRole: string) {
  if (userRole === "admin") {
    return {
      eyebrow: "Admin desk",
      title: "Dashboard"
    };
  }

  if (userRole === "master") {
    return {
      eyebrow: "Master desk",
      title: "Dashboard"
    };
  }

  return {
    eyebrow: "Worker desk",
    title: "Dashboard"
  };
}
