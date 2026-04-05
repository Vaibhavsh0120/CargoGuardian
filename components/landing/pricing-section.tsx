import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Check } from "lucide-react";

const plans: ReadonlyArray<{
  name: string;
  description: string;
  focus: string;
  features: readonly string[];
  cta: string;
  href: Route;
  popular: boolean;
}> = [
  {
    name: "Admin",
    description: "Create trains, link hardware tokens, and operate across the full fleet.",
    focus: "Fleet-wide control",
    features: [
      "Create and configure trains",
      "Grant or revoke access for any role",
      "Review alerts across the full fleet",
      "Keep system-wide visibility",
      "Manage operational correction",
    ],
    cta: "Login as admin",
    href: "/login",
    popular: false,
  },
  {
    name: "Master",
    description: "Coordinate workers, approve requests, and keep departures moving cleanly.",
    focus: "Managed train groups",
    features: [
      "Approve or reject worker requests",
      "Grant remote or RFID-backed clearance",
      "Monitor incidents in assigned scope",
      "Keep worker flow organized",
      "See managed trains during transit",
    ],
    cta: "Create master account",
    href: "/signup",
    popular: true,
  },
  {
    name: "Worker",
    description: "Inspect only assigned trains before clearance closes the window to act.",
    focus: "Tight inspection scope",
    features: [
      "See assigned trains only",
      "Work pre-clearance inspection flow",
      "Request train access when needed",
      "Stay out of cleared train clutter",
      "Open a simpler workspace",
    ],
    cta: "Create worker account",
    href: "/signup",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="roles" className="relative py-32 lg:py-40 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-6">
            Roles
          </span>
          <h2 className="font-editorial text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
            Three operator views.
            <br />
            <span className="text-stroke">One product model.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            CargoGuardian does not need a separate control surface for every person. It needs the right scope for each role.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`relative p-8 lg:p-12 bg-background ${
                plan.popular ? "md:-my-4 md:py-12 lg:py-16 border-2 border-foreground" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-primary-foreground text-xs font-mono uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="font-editorial text-3xl text-foreground mt-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8 pb-8 border-b border-foreground/10">
                <span className="font-editorial text-4xl lg:text-5xl text-foreground">{plan.focus}</span>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                  plan.popular
                    ? "bg-foreground text-primary-foreground hover:bg-foreground/90"
                    : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Worker visibility ends after clearance, and admins keep the broadest operational view.
        </p>
      </div>
    </section>
  );
}
