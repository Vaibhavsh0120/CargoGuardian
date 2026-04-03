export type UserRole = "viewer" | "operator" | "admin";

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  readOnly: boolean;
};
