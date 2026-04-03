import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const setupItems = [
  "Next.js 15 App Router scaffold",
  "React Query provider",
  "Tailwind theme tokens",
  "shadcn-style UI primitives",
  "Firebase client/admin bootstrap",
  "Health check route"
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
          CargoGuardian Foundation
        </p>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            Dashboard placeholder
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Phase 1 is complete when this protected shell renders with the shared layout, providers,
            and theme system in place.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {setupItems.map((item) => (
          <Card key={item} className="border-white/70 shadow-panel">
            <CardHeader>
              <CardTitle className="font-display text-lg">{item}</CardTitle>
              <CardDescription>Foundation layer installed and ready for feature work.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 rounded-full bg-surface-high">
                <div className="h-2 w-full rounded-full primary-gradient" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
