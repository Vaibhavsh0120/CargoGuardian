import type { UserRole } from "@/types/user";

export const roleLabels: Record<UserRole, string> = {
  worker: "Worker",
  master: "Train Master",
  admin: "Administrator"
};
