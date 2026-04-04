import Link from "next/link";

import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthGuardNotice } from "@/features/auth/components/AuthGuardNotice";
import { AdminInviteForm } from "@/features/auth/components/AdminInviteForm";
import { getServerEnv } from "@/lib/env/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function AdminInvitePage({
  searchParams
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await redirectAuthenticatedUser();

  const { code } = await searchParams;
  const { ADMIN_INVITE_SECRET } = getServerEnv();

  if (!ADMIN_INVITE_SECRET || code !== ADMIN_INVITE_SECRET) {
    return (
      <div className="w-full max-w-md space-y-4">
        <AuthGuardNotice
          title="Access Denied"
          description="The invite link you used is invalid or has expired."
        />
        <AuthCard
          badgeLabel="Restricted"
          title="Invalid Invite Code"
          description="Admin accounts can only be created with a valid invite code. Enter the correct code below."
        >
          <form action="/admin-invite" method="GET" className="space-y-4">
            <Input
              name="code"
              type="text"
              placeholder="Enter invite code"
              required
              defaultValue={code ?? ""}
            />
            <Button type="submit" className="w-full">
              Verify Code
            </Button>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                Return to Login
              </Button>
            </Link>
          </form>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <AuthGuardNotice
        title="Admin Onboarding"
        description="This is a secure onboarding path. Creating this account grants full administrative rights to the CargoGuardian system."
      />
      <AuthCard
        badgeLabel="Admin Access"
        title="Create Admin Account"
        description="Configure your primary administrative account."
      >
        <AdminInviteForm inviteCode={code} />
      </AuthCard>
    </div>
  );
}
