"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword";

export function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPassword();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      await forgotPasswordMutation.mutateAsync(email);
      setSuccessMessage("Password reset email sent. Check your inbox and spam folder.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send reset email.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input name="email" type="email" placeholder="operator@cargoguardian.dev" required />

      {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm font-medium text-secondary">{successMessage}</p> : null}

      <Button className="w-full" disabled={forgotPasswordMutation.isPending}>
        {forgotPasswordMutation.isPending ? "Sending..." : "Send reset link"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link className="font-medium text-primary" href="/login">
          Return to login
        </Link>
      </p>
    </form>
  );
}
