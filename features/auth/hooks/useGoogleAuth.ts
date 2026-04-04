"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signInWithGooglePopup } from "@/features/auth/services/auth-client";
import { syncSession } from "@/features/auth/services/auth-server";
import { isRoleSelectionRequired } from "@/types/user";

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

export function useGoogleAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const credential = await signInWithGooglePopup();
        const idToken = await credential.user.getIdToken();
        return syncSession(idToken);
      } catch (error) {
        throw new Error(normalizeGoogleAuthError(error));
      }
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      if (data.user && isRoleSelectionRequired(data.user.role)) {
        router.replace("/onboarding" as Parameters<typeof router.replace>[0]);
      } else {
        router.replace("/dashboard" as Parameters<typeof router.replace>[0]);
      }
      router.refresh();
    }
  });
}
