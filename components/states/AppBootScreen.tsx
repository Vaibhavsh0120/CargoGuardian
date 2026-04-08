export function AppBootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-border/60 bg-card/90 p-8 text-center shadow-panel">
        <p className="font-display text-3xl tracking-tight text-foreground">CargoGuardian</p>
        <div className="mx-auto mt-6 h-2.5 w-40 overflow-hidden rounded-full bg-muted">
          <div className="shell-loading-progress h-full w-full rounded-full bg-primary" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    </div>
  );
}
