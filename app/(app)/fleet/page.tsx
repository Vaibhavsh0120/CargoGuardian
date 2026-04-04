"use client";

import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingPanel } from "@/components/states/LoadingPanel";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FleetEmptyState } from "@/features/fleet/components/FleetEmptyState";
import { FleetFilters } from "@/features/fleet/components/FleetFilters";
import { FleetTable } from "@/features/fleet/components/FleetTable";
import { useFleet } from "@/features/fleet/hooks/useFleet";

export default function FleetPage() {
  const {
    trains,
    isLoading,
    isError,
    refetch,
    fetchedAt,
    statusFilter,
    setStatusFilter,
    search,
    setSearch
  } = useFleet();

  if (isLoading) {
    return <LoadingPanel />;
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fleet"
        title="Fleet overview"
        description={`${trains.length} train${trains.length !== 1 ? "s" : ""} in your fleet.`}
        actions={
          <Link href={"/trains/new" as Route} className={buttonVariants()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add train
          </Link>
        }
      />

      {/* Freshness indicator */}
      {fetchedAt ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            Last refreshed {new Date(fetchedAt).toLocaleTimeString()}
          </Badge>
        </div>
      ) : null}

      <FleetFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {trains.length === 0 ? (
        <FleetEmptyState hasFilters={hasFilters} />
      ) : (
        <FleetTable trains={trains} />
      )}
    </div>
  );
}
