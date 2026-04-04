export const USER_ROLE_VALUES = ["not-set", "worker", "master", "admin"] as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  readOnly: boolean;
  isNewProfile?: boolean;
};

export type TrainAssignment = {
  id: string;
  trainId: string;
  userId: string;
  role: UserRole;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
};

export function isRoleSelectionRequired(role: UserRole) {
  return role === "not-set";
}

export function isOnboardingComplete(user: Pick<AppUser, "role"> | null | undefined) {
  return Boolean(user && !isRoleSelectionRequired(user.role));
}
