"use client";

import Link from "next/link";
import { AnimatedWave } from "./animated-wave";

const footerSections = [
  {
    title: "Overview",
    links: [
      { name: "Features", href: "#features" },
      { name: "How it works", href: "#how-it-works" },
      { name: "Start", href: "#cta" }
    ]
  },
  {
    title: "Access",
    links: [
      { name: "Login", href: "/login" },
      { name: "Signup", href: "/signup" },
      { name: "Dashboard", href: "/dashboard" },
      { name: "Fleet", href: "/fleet" }
    ]
  }
] as const;

export function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      {/* Animated wave background */}
      <div className="absolute inset-0 h-64 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-16 lg:py-24">
          <div className="grid gap-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] lg:gap-8">
            {/* Brand Column */}
            <div className="max-w-md">
              <Link href="/" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-editorial">CargoGuardian</span>
              </Link>

              <p className="text-muted-foreground leading-relaxed mb-8 max-w-xs">
                Dashboard-first rail cargo clearance and monitoring for one-train, one-hardware operations.
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                One train record carries clearance, telemetry, alerts, access, and transit context from inspection through movement.
              </p>
            </div>

            {/* Link Columns */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-medium mb-6">{section.title}</h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            2026 CargoGuardian. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Public landing page live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
