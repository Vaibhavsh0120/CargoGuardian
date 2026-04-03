"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AuthStatusControls() {
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

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-foreground">{user.displayName ?? user.email}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{user.role}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
        <LogOut className="h-4 w-4" />
        {isLoggingOut ? "Signing out..." : "Logout"}
      </Button>
    </div>
  );
}
