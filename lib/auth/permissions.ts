import type { AppUser, UserRole } from "@/types/user";

const roleWeight: Record<UserRole, number> = {
  worker: 1,
  master: 2,
  admin: 3
};

export function hasRole(user: AppUser | null, minimumRole: UserRole) {
  if (!user) {
    return false;
  }

  return roleWeight[user.role] >= roleWeight[minimumRole];
}

export function isReadOnlyUser(user: AppUser | null) {
  return Boolean(user?.readOnly || user?.role === "worker");
}
