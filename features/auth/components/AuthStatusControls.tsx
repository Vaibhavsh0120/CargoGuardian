"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { roleLabels } from "@/lib/constants/roles";

export function AuthStatusControls({ compact }: Readonly<{ compact?: boolean }>) {
  const router = useRouter();
  const { user, logout, isLoggingOut } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  if (!user) {
    return null;
  }

  const identity = user.displayName ?? user.email ?? "Operator";
  const initials = identity
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground">
          {initials || "CG"}
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleLogout} disabled={isLoggingOut} title="Sign out">
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-3 rounded-2xl border border-border/70 bg-card/85 px-3 py-2 shadow-panel sm:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">
          {initials || "CG"}
        </div>
        <div className="text-left">
          <p className="max-w-40 truncate text-sm font-semibold text-foreground">{identity}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {roleLabels[user.role]}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
        <LogOut className="h-4 w-4" />
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  );
}
