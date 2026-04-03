"use client";

import { ErrorState } from "@/components/states/ErrorState";

export default function AppError({
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <ErrorState
      title="This workspace hit an unexpected error"
      description="Refresh the route state and try again. If the problem persists, inspect the shell data providers and route handler responses."
      onAction={reset}
    />
  );
}
