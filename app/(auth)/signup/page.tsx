import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthGuardNotice } from "@/features/auth/components/AuthGuardNotice";

export default function SignupPage() {
  return (
    <div className="w-full max-w-md space-y-4">
      <AuthGuardNotice
        title="Operator onboarding"
        description="Create an operator account and the initial user profile document for CargoGuardian."
      />
      <AuthCard
        badgeLabel="Operator access"
        title="Create account"
        description="Create your operator account before entering the protected dashboard."
      >
        <AuthForm mode="signup" />
      </AuthCard>
    </div>
  );
}
