"use client";

import { AuthSessionSync } from "@/features/auth/components/AuthSessionSync";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthSessionSync />
        {children}
        <ToastProvider />
      </QueryProvider>
    </ThemeProvider>
  );
}
