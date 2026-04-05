export function AppBootScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,hsl(var(--surface-low))_0%,hsl(var(--background))_55%,hsl(var(--surface-low))_100%)]">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,hsla(var(--primary),0.16),transparent_65%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-5xl rounded-[2rem] border border-border/60 bg-card/88 p-6 shadow-panel backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-end">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">CargoGuardian</p>
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Loading the rail operations workspace
                </h1>
                <p className="max-w-md text-sm text-muted-foreground sm:text-base">
                  Preparing navigation, train context, access control, and live operational data.
                </p>
              </div>

              <div className="space-y-3">
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-2/3 animate-pulse rounded-full bg-primary" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-8 w-14 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-8 w-16 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-8 w-12 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-border/60 bg-background/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-10 w-10 animate-pulse rounded-2xl bg-muted" />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4">
                    <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-14 animate-pulse rounded-2xl bg-muted" />
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-14 animate-pulse rounded-2xl bg-muted" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-24 animate-pulse rounded-[1.5rem] border border-border/60 bg-background/70" />
                <div className="h-24 animate-pulse rounded-[1.5rem] border border-border/60 bg-background/70" />
                <div className="h-24 animate-pulse rounded-[1.5rem] border border-border/60 bg-background/70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
