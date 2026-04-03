import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-lg border-white/60 shadow-ambient">
        <CardHeader>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
            Navigation Error
          </p>
          <CardTitle className="font-display text-3xl text-foreground">
            The requested route was not found.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Return to the dashboard shell and continue with the next implementation phase.
          </p>
          <Link href="/dashboard" className={cn(buttonVariants(), "inline-flex")}>
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
