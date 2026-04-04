"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleMark } from "@/features/auth/components/GoogleMark";
import { useAdminSignup } from "@/features/auth/hooks/useAdminSignup";
import { useGoogleAdminSignup } from "@/features/auth/hooks/useGoogleAdminSignup";

export function AdminInviteForm({ inviteCode }: Readonly<{ inviteCode: string }>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const adminSignupMutation = useAdminSignup();
  const googleAdminSignupMutation = useGoogleAdminSignup();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      await adminSignupMutation.mutateAsync({
        displayName,
        email,
        password,
        inviteCode
      });

      startTransition(() => {
        router.replace("/dashboard" as Parameters<typeof router.replace>[0]);
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Admin creation failed.");
    }
  }

  async function onGoogleAdminSignup() {
    setErrorMessage(null);

    try {
      await googleAdminSignupMutation.mutateAsync(inviteCode);
      startTransition(() => {
        router.replace("/dashboard" as Parameters<typeof router.replace>[0]);
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Admin creation failed.");
    }
  }

  const loading =
    isPending || adminSignupMutation.isPending || googleAdminSignupMutation.isPending;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input name="displayName" placeholder="Admin Full Name" required />
        <Input name="email" type="email" placeholder="admin@cargoguardian.dev" required />
        <Input name="password" type="password" placeholder="Password" required minLength={8} />
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          required
          minLength={8}
        />

        {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}

        <Button className="w-full" disabled={loading}>
          {loading ? "Creating Account..." : "Create Admin Account"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={onGoogleAdminSignup}
      >
        <GoogleMark />
        <span>Continue with Google</span>
      </Button>
    </div>
  );
}
