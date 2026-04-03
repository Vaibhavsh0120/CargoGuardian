import type { AppUser } from "@/types/user";

export type AuthSessionResponse = {
  authenticated: boolean;
  user: AppUser | null;
};

export type LoginFormInput = {
  email: string;
  password: string;
};

export type SignupFormInput = {
  displayName: string;
  email: string;
  password: string;
};

export type SessionCookiePayload = {
  idToken: string;
};
