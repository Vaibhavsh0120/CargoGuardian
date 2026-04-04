import { redirect } from "next/navigation";

import { getCurrentSessionUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/user";
import { hasRole } from "@/lib/auth/permissions";

export async function requireUser() {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function redirectAuthenticatedUser() {
  const user = await getCurrentSessionUser();

  if (user && user.roleSelected) {
    redirect("/dashboard");
  }
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();

  if (!hasRole(user, role)) {
    redirect("/dashboard");
  }

  return user;
}
