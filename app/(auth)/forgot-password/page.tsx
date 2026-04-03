import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthGuardNotice } from "@/features/auth/components/AuthGuardNotice";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-4">
      <AuthGuardNotice
        title="Password recovery"
        description="Request a secure reset link for your CargoGuardian operator account."
      />
      <AuthCard
        badgeLabel="Account recovery"
        title="Reset password"
        description="Enter your email address and we will send you a password reset link."
      >
        <ForgotPasswordForm />
      </AuthCard>
    </div>
  );
}
