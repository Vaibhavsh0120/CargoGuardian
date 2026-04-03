import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthGuardNotice } from "@/features/auth/components/AuthGuardNotice";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-4">
      <AuthGuardNotice
        title="CargoGuardian access"
        description="Sign in with Firebase Authentication to enter the protected dashboard."
      />
      <AuthCard
        badgeLabel="Secure access"
        title="Login"
        description="Use your operator credentials to open the CargoGuardian control console."
      >
        <AuthForm mode="login" />
      </AuthCard>
    </div>
  );
}
