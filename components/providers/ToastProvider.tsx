"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        className: "border border-white/60 bg-card text-card-foreground shadow-panel"
      }}
    />
  );
}
