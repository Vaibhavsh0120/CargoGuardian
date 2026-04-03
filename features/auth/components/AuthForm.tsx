"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { GoogleMark } from "@/features/auth/components/GoogleMark";
import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { Input } from "@/components/ui/input";
import type { LoginFormInput, SignupFormInput } from "@/features/auth/types/auth";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { useSignup } from "@/features/auth/hooks/useSignup";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: Readonly<{ mode: AuthMode }>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const googleAuthMutation = useGoogleAuth();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ email, password } satisfies LoginFormInput);
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        await signupMutation.mutateAsync({
          displayName,
          email,
          password
        } satisfies SignupFormInput);
      }

      startTransition(() => {
        router.replace("/dashboard");
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  async function onGoogleAuth() {
    setErrorMessage(null);

    try {
      await googleAuthMutation.mutateAsync();
      startTransition(() => {
        router.replace("/dashboard");
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  const loading =
    isPending || loginMutation.isPending || signupMutation.isPending || googleAuthMutation.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" ? <Input name="displayName" placeholder="Full name" required /> : null}
      <Input name="email" type="email" placeholder="operator@cargoguardian.dev" required />
      <Input name="password" type="password" placeholder="Password" required minLength={8} />
      {mode === "signup" ? (
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          required
          minLength={8}
        />
      ) : null}

      {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}

      <Button className="w-full" disabled={loading}>
        {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
      </Button>

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
        onClick={onGoogleAuth}
      >
        <GoogleMark />
        <span>{mode === "login" ? "Continue with Google" : "Create account with Google"}</span>
      </Button>

      {mode === "login" ? (
        <div className="text-right">
          <Link className="text-sm font-medium text-primary" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {mode === "login" ? "Need an account?" : "Already have access?"}{" "}
        <Link className="font-medium text-primary" href={mode === "login" ? "/signup" : "/login"}>
          {mode === "login" ? "Open signup" : "Return to login"}
        </Link>
      </p>
    </form>
  );
}
