import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
  icon: Icon = Inbox
}: Readonly<{
  title: string;
  description: string;
  actionHref?: Route;
  actionLabel?: string;
  className?: string;
  icon?: LucideIcon;
}>) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-dashed border-border/80 bg-card/80 p-8 text-center shadow-panel",
        className
      )}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className={buttonVariants()}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
