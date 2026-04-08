"use client";

import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/states/ErrorState";
import { FleetPageSkeleton } from "@/components/states/PageSkeletons";
import { buttonVariants } from "@/components/ui/button";
import { FleetEmptyState } from "@/features/fleet/components/FleetEmptyState";
import { FleetFilters } from "@/features/fleet/components/FleetFilters";
import { FleetTable } from "@/features/fleet/components/FleetTable";
import { useSession } from "@/features/auth/hooks/useSession";
import { useFleet } from "@/features/fleet/hooks/useFleet";

export default function FleetPage() {
  const sessionQuery = useSession();
  const {
    trains,
    isLoading,
    isError,
    refetch,
    statusFilter,
    setStatusFilter,
    search,
    setSearch
  } = useFleet();

  if (isLoading) {
    return <FleetPageSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Fleet could not be loaded"
        description="There was a problem loading the train fleet data. Please try again."
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  const hasFilters = Boolean(statusFilter ?? search);
  const canCreateTrain = sessionQuery.data?.user?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Train fleet"
        title="Fleet"
        actions={canCreateTrain ? (
          <Link href={"/trains/new" as Route} className={buttonVariants()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add train
          </Link>
        ) : undefined}
      />

      <FleetFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {trains.length === 0 ? (
        <FleetEmptyState hasFilters={hasFilters} canCreateTrain={canCreateTrain} />
      ) : (
        <FleetTable trains={trains} />
      )}
    </div>
  );
}
