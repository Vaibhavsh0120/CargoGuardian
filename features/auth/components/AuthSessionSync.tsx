"use client";

import { useEffect, useRef } from "react";

import { subscribeToIdTokenChanges } from "@/features/auth/services/auth-client";
import { syncSession } from "@/features/auth/services/auth-server";
import { logger } from "@/lib/logger";

export function AuthSessionSync() {
  const previousUidRef = useRef<string | null>(null);

  useEffect(() => {
    return subscribeToIdTokenChanges(async (user) => {
      try {
        if (!user) {
          previousUidRef.current = null;
          return;
        }

        const token = await user.getIdToken();
        previousUidRef.current = user.uid;
        await syncSession(token);
      } catch (error) {
        logger.warn("Failed to sync Firebase session cookie.", error);
      }
    });
  }, []);

  return null;
}
