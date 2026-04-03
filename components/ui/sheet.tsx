import * as React from "react";

import { cn } from "@/lib/utils";

export function Sheet({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

export function SheetTrigger(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />;
}

export function SheetContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <aside
      className={cn(
        "w-full max-w-sm rounded-l-2xl border border-border bg-card p-6 text-card-foreground shadow-ambient",
        className
      )}
      {...props}
    />
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1.5", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-lg font-bold", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
