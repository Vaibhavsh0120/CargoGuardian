import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title,
  description,
  actionLabel = "Try again",
  onAction,
  className
}: Readonly<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-destructive/20 bg-destructive/5 p-8 shadow-panel",
        className
      )}
    >
      <div className="max-w-xl space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-destructive">
            Attention
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {onAction ? (
          <Button variant="destructive" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
