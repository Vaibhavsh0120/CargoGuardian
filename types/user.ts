export type UserRole = "worker" | "master" | "admin";

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  readOnly: boolean;
  isNewProfile?: boolean;
  roleSelected?: boolean;
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
