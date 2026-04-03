"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logoutFirebaseUser } from "@/features/auth/services/auth-client";
import { destroySession } from "@/features/auth/services/auth-server";
import { useSession } from "@/features/auth/hooks/useSession";

export function useAuth() {
  const queryClient = useQueryClient();
  const sessionQuery = useSession();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logoutFirebaseUser();
      await destroySession();
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    }
  });

  return {
    ...sessionQuery,
    user: sessionQuery.data?.user ?? null,
    isAuthenticated: Boolean(sessionQuery.data?.authenticated && sessionQuery.data.user),
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending
  };
}
