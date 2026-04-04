"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signupWithEmailPassword } from "@/features/auth/services/auth-client";
import { createSignupSession } from "@/features/auth/services/auth-server";

function normalizeAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to create account.";
  }

  if (error.message.includes("auth/email-already-in-use")) {
    return "This email address is already in use.";
  }

  return error.message;
}

export function useAdminSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { displayName: string; email: string; password: string }) => {
      try {
        const credential = await signupWithEmailPassword(input);
        const idToken = await credential.user.getIdToken();
        return createSignupSession(idToken, "admin");
      } catch (error) {
        throw new Error(normalizeAuthError(error));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    }
  });
}
