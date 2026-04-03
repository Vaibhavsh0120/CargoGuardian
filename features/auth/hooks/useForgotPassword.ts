"use client";

import { useMutation } from "@tanstack/react-query";

import { sendResetPasswordEmail } from "@/features/auth/services/auth-client";

function normalizeResetError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to send reset email.";
  }

  if (error.message.includes("auth/user-not-found")) {
    return "No account was found for that email address.";
  }

  if (error.message.includes("auth/invalid-email")) {
    return "Enter a valid email address.";
  }

  return error.message;
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      try {
        await sendResetPasswordEmail(email);
      } catch (error) {
        throw new Error(normalizeResetError(error));
      }
    }
  });
}
