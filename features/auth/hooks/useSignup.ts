"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signupWithEmailPassword } from "@/features/auth/services/auth-client";
import { createSignupSession } from "@/features/auth/services/auth-server";
import type { SignupFormInput } from "@/features/auth/types/auth";

function normalizeAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to create account.";
  }

  if (error.message.includes("auth/email-already-in-use")) {
    return "This email address is already in use.";
  }

  return error.message;
}

export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SignupFormInput) => {
      try {
        const credential = await signupWithEmailPassword(input);
        const idToken = await credential.user.getIdToken();
        return createSignupSession(idToken);
      } catch (error) {
        throw new Error(normalizeAuthError(error));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      router.replace("/onboarding" as Parameters<typeof router.replace>[0]);
      router.refresh();
    }
  });
}
