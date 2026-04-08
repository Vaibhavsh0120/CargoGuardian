"use client";

import { usePathname } from "next/navigation";
import { TrainFront } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { AuthStatusControls } from "@/features/auth/components/AuthStatusControls";
import { useTrainContext } from "@/hooks/useTrainContext";
import { cn } from "@/lib/utils";

const HIDDEN_ROUTES = ["/settings", "/fleet", "/access"];

export function AppHeader() {
  const pathname = usePathname();
  const isHidden = HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isHidden) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-xl">
      <CompactTrainSelector />
      <div className="ml-auto">
        <AuthStatusControls compact />
      </div>
    </header>
  );
}

function CompactTrainSelector() {
  const { isError, isLoading, refresh, selectedTrain, selectedTrainId, setSelectedTrainId, trains } =
    useTrainContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <TrainFront className="h-4 w-4" />
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
      </div>
    );
  }

  if (isError || !trains.length) {
    return (
      <button
        type="button"
        onClick={() => {
          void refresh();
        }}
        className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
        title={isError ? "Retry loading trains" : "Refresh train list"}
      >
        <TrainFront className="h-4 w-4" />
        <span>{isError ? "Retry trains" : "No trains"}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TrainFront className="h-4 w-4 text-muted-foreground" />
      <select
        value={selectedTrainId ?? ""}
        onChange={(event) => setSelectedTrainId(event.target.value || null)}
        className="h-8 max-w-[14rem] rounded-md border border-border/60 bg-transparent px-2 text-sm font-medium text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring sm:max-w-[18rem]"
      >
        {trains.map((train) => (
          <option key={train.id} value={train.id}>
            {train.code} - {train.label}
          </option>
        ))}
      </select>
      {selectedTrain ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            selectedTrain.status === "active"
              ? "bg-emerald-500"
              : selectedTrain.status === "warning"
                ? "bg-amber-500"
                : selectedTrain.status === "critical"
                  ? "bg-red-500"
                  : "bg-muted"
          )}
        />
      ) : null}
    </div>
  );
}
