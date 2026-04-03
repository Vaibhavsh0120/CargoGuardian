import type { UserRole } from "@/types/user";

export const roleLabels: Record<UserRole, string> = {
  viewer: "View only",
  operator: "Operator",
  admin: "Administrator"
};
