import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className
}: Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 border-b border-border/40 bg-background py-6 sm:flex-row sm:items-end sm:justify-between sm:py-8",
        className
      )}
    >
      <div className="max-w-3xl space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.20em] text-muted-foreground">{eyebrow}</p>
        ) : null}
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </section>
  );
}
