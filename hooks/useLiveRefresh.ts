"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

type UseLiveRefreshOptions = {
  queryKeys: QueryKey[];
  enabled?: boolean;
  intervalMs?: number;
};

export function useLiveRefresh({
  queryKeys,
  enabled = true,
  intervalMs = 15_000
}: UseLiveRefreshOptions) {
  const queryClient = useQueryClient();

  const refresh = useCallback(() => {
    void Promise.all(
      queryKeys.map((queryKey) =>
        queryClient.invalidateQueries({
          queryKey
        })
      )
    );
  }, [queryClient, queryKeys]);

  useEffect(() => {
    if (!enabled || !queryKeys.length) {
      return;
    }

    const timer = window.setInterval(() => {
      refresh();
    }, intervalMs);

    const handleFocus = () => {
      refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, intervalMs, queryKeys, refresh]);
}
