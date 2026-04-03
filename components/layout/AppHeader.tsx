import { AuthStatusControls } from "@/features/auth/components/AuthStatusControls";

import { AppCommandBar } from "@/components/layout/AppCommandBar";
import { AppStatusIndicators } from "@/components/layout/AppStatusIndicators";
import { TrainSelector } from "@/components/layout/TrainSelector";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="font-display text-xl font-extrabold tracking-tight text-foreground">
              CargoGuardian
            </p>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Rail operations console
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AppStatusIndicators />
            <AuthStatusControls />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <AppCommandBar compact className="lg:hidden" />
          <AppCommandBar className="hidden lg:flex" />
          <TrainSelector />
        </div>
      </div>
    </header>
  );
}
