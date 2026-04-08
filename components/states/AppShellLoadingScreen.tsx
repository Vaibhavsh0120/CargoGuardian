export function AppShellLoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-[1.5rem] border border-border/60 bg-card/90 p-8 text-center shadow-panel">
        <p className="font-display text-2xl tracking-tight text-foreground">Loading</p>
        <div className="mx-auto mt-5 h-2.5 w-32 overflow-hidden rounded-full bg-muted">
          <div className="shell-loading-progress h-full w-full rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
