import { LandingPage } from "@/features/landing/components/LandingPage";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function HomePage() {
  await redirectAuthenticatedUser();

  return <LandingPage />;
}
