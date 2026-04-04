"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";

export function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const rawRole = String(formData.get("role") ?? "");
    const role = rawRole === "master" ? "master" : "worker";

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        throw new Error("Failed to update profile.");
      }

      startTransition(() => {
        router.replace("/dashboard" as Parameters<typeof router.replace>[0]);
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Update failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium leading-none text-foreground">Select Role</label>
        <select
          name="role"
          required
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="worker">Worker (Read Only / Task execution)</option>
          <option value="master">Train Master (Fleet Management / Editing)</option>
        </select>
      </div>

      {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}

      <Button className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Continue to Dashboard"}
      </Button>
    </form>
  );
}
