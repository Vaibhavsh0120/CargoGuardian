import type { UserRole } from "@/types/user";

export const roleLabels: Record<UserRole, string> = {
  "not-set": "Role Not Selected",
  worker: "Worker",
  master: "Train Master",
  admin: "Administrator"
};
