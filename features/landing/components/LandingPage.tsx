import type { CSSProperties } from "react";

import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { FooterSection } from "@/components/landing/footer-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { Navigation } from "@/components/landing/navigation";

const landingTheme = {
  "--background": "42 17% 96%",
  "--foreground": "28 12% 10%",
  "--card": "0 0% 100%",
  "--card-foreground": "28 12% 10%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "28 12% 10%",
  "--primary": "28 12% 10%",
  "--primary-deep": "28 12% 10%",
  "--primary-foreground": "42 17% 96%",
  "--secondary": "42 12% 92%",
  "--secondary-foreground": "28 12% 10%",
  "--muted": "42 10% 91%",
  "--muted-foreground": "28 8% 37%",
  "--accent": "42 12% 89%",
  "--accent-foreground": "28 12% 10%",
  "--destructive": "0 75% 42%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "38 12% 83%",
  "--input": "42 10% 91%",
  "--ring": "28 12% 10%",
  colorScheme: "light"
} as CSSProperties;

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay" style={landingTheme}>
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
