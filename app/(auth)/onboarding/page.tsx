import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthGuardNotice } from "@/features/auth/components/AuthGuardNotice";
import { OnboardingForm } from "@/features/auth/components/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-md space-y-4">
      <AuthGuardNotice
        title="Complete Profile"
        description="Choose your operator role to access the CargoGuardian dashboard."
      />
      <AuthCard
        badgeLabel="Setup"
        title="Select your role"
        description="Choose your operator role to finish setting up your account."
      >
        <OnboardingForm />
      </AuthCard>
    </div>
  );
}
