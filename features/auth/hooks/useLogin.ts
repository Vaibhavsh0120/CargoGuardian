"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { loginWithEmailPassword } from "@/features/auth/services/auth-client";
import { createLoginSession } from "@/features/auth/services/auth-server";
import type { LoginFormInput } from "@/features/auth/types/auth";

function normalizeAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to complete login.";
  }

  if (error.message.includes("auth/invalid-credential")) {
    return "Invalid email or password.";
  }

  return error.message;
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginFormInput) => {
      try {
        const credential = await loginWithEmailPassword(input);
        const idToken = await credential.user.getIdToken();
        return createLoginSession(idToken);
      } catch (error) {
        throw new Error(normalizeAuthError(error));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    }
  });
}
