import { redirect } from "next/navigation";

import { getCurrentSessionUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/user";
import { hasRole } from "@/lib/auth/permissions";
import { requiresRoleSelection } from "@/features/auth/services/user-profile-server";

export async function requireUser() {
  const user = await getCurrentSessionUser({ allowIncomplete: true });

  if (!user) {
    redirect("/login");
  }

  if (requiresRoleSelection(user)) {
    redirect("/onboarding");
  }

  return user;
}

export async function redirectAuthenticatedUser() {
  const user = await getCurrentSessionUser({ allowIncomplete: true });

  if (!user) {
    return;
  }

  if (requiresRoleSelection(user)) {
    redirect("/onboarding");
  }

  if (user) {
    redirect("/dashboard");
  }
}

export async function requireIncompleteUser() {
  const user = await getCurrentSessionUser({ allowIncomplete: true });

  if (!user) {
    redirect("/login");
  }

  if (!requiresRoleSelection(user)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();

  if (!hasRole(user, role)) {
    redirect("/dashboard");
  }

  return user;
}
