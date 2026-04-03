"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSession } from "@/features/auth/services/auth-server";

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchSession,
    staleTime: 60_000
  });
}
