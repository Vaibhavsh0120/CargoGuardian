import Link from "next/link";
import type { Route } from "next";
import { TrainFront } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export function FleetEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <section className="rounded-[1.75rem] border border-dashed border-border/80 bg-card/80 p-8 text-center shadow-panel">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TrainFront className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {hasFilters ? "No matching trains" : "No trains in your fleet"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting your search or removing filters to see more results."
              : "Register your first train to start monitoring its cargo and telemetry."}
          </p>
        </div>
        {!hasFilters ? (
          <Link href={"/trains/new" as Route} className={buttonVariants()}>
            Add train
          </Link>
        ) : null}
      </div>
    </section>
  );
}
