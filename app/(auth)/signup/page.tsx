import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthGuardNotice } from "@/features/auth/components/AuthGuardNotice";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function SignupPage() {
  await redirectAuthenticatedUser();

  return (
    <div className="w-full max-w-md space-y-4">
      <AuthGuardNotice
        title="Operator onboarding"
        description="Create an operator account and the initial user profile document for CargoGuardian."
      />
      <AuthCard
        badgeLabel="Operator access"
        title="Create account"
        description="Create your operator account, then choose worker or master before entering the protected dashboard."
      >
        <AuthForm mode="signup" />
      </AuthCard>
    </div>
  );
}
