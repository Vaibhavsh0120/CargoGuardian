"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "I",
    title: "Set up the real train record",
    description:
      "The admin creates the train, links the matching Blynk token, and keeps the hardware identity attached to the same operational record from the start.",
    actor: "Admin",
    system: "CargoGuardian stores the train, token, and inspection-stage state in one place.",
    focus: "Train = Device is the actual operating model, not a separate hardware sidecar.",
    outcome: "A real train record is ready to receive telemetry and access rules."
  },
  {
    number: "II",
    title: "Control who can work on the train",
    description:
      "Workers can inspect only assigned trains before clearance, while masters keep the broader supervised view and approve access where needed.",
    actor: "Worker + Master",
    system: "CargoGuardian narrows visibility by role and by journey stage instead of showing the whole fleet to everyone.",
    focus: "The workspace stays clean because only the right operator can act at the right time.",
    outcome: "The workspace stays clean because only the right operator can act at the right time."
  },
  {
    number: "III",
    title: "Move into live transit monitoring",
    description:
      "After remote or RFID-backed clearance, the same train record carries GPS movement, derived speed, weight change risk, and incident context into transit.",
    actor: "Master + System",
    system: "CargoGuardian grants clearance, updates state, and keeps telemetry, alerts, and history attached to that train.",
    focus: "The train leaves the yard, but the operational context does not break apart.",
    outcome: "The train leaves the yard, but the operational context does not break apart."
  }
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-foreground text-background overflow-hidden"
    >
      {/* Diagonal lines pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            currentColor 40px,
            currentColor 41px
          )`
        }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Workflow
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-editorial tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            How CargoGuardian works.
            <br />
            <span className="text-background/50">One train thread from setup to transit.</span>
          </h2>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full text-left py-8 border-b border-background/10 transition-all duration-500 group ${
                  activeStep === index ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-editorial text-3xl text-background/30">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-editorial mb-3 group-hover:translate-x-2 transition-transform duration-300">
                      {step.title}
                    </h3>
                    <p className="text-background/60 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail display */}
          <div className="lg:sticky lg:top-32 self-start">
            <div className="border border-background/10 overflow-hidden rounded-[1.75rem] bg-white/[0.02]">
              <div className="px-6 py-5 border-b border-background/10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.22em] text-background/40">
                    Active moment
                  </p>
                  <p className="mt-2 text-2xl font-editorial text-background">
                    {steps[activeStep].number}. {steps[activeStep].title}
                  </p>
                </div>
                <span className="rounded-full border border-background/15 px-3 py-1 text-xs font-mono text-background/55">
                  Live workflow
                </span>
              </div>

              <div className="grid gap-4 p-6 md:p-8">
                <DetailCard label="Who acts" value={steps[activeStep].actor} />
                <DetailCard label="What CargoGuardian does" value={steps[activeStep].system} />
                <DetailCard label="What matters here" value={steps[activeStep].focus} />
                <div className="rounded-[1.25rem] border border-background/10 bg-background/5 p-5">
                  <p className="text-xs font-mono uppercase tracking-[0.22em] text-background/40">
                    Outcome
                  </p>
                  <p className="mt-3 text-base leading-8 text-background/78">
                    {steps[activeStep].outcome}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-[1.25rem] border border-background/10 bg-background/5 p-5">
      <p className="text-xs font-mono uppercase tracking-[0.22em] text-background/40">{label}</p>
      <p className="mt-3 text-base leading-8 text-background/78">{value}</p>
    </div>
  );
}
