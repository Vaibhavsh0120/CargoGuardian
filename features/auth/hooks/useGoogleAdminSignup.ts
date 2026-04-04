"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signInWithGooglePopup } from "@/features/auth/services/auth-client";
import { createAdminSignupSession } from "@/features/auth/services/auth-server";

function normalizeGoogleAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to continue with Google.";
  }

  if (error.message.includes("auth/popup-closed-by-user")) {
    return "Google sign-in was closed before it finished.";
  }

  if (error.message.includes("auth/popup-blocked")) {
    return "Your browser blocked the Google sign-in popup.";
  }

  if (error.message.includes("auth/cancelled-popup-request")) {
    return "Another Google sign-in request is already in progress.";
  }

  return error.message;
}

export function useGoogleAdminSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      try {
        const credential = await signInWithGooglePopup();
        const idToken = await credential.user.getIdToken();
        return createAdminSignupSession(idToken, inviteCode);
      } catch (error) {
        throw new Error(normalizeGoogleAuthError(error));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    }
  });
}
