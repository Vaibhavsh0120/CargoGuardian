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
          CargoGuardian
        </p>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            Operations dashboard
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Your operations workspace is active. Fleet monitoring, telemetry, and analytics modules
            will appear here as the platform is connected to live services.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {setupItems.map((item) => (
          <Card key={item} className="border-white/70 shadow-panel">
            <CardHeader>
              <CardTitle className="font-display text-lg">{item}</CardTitle>
              <CardDescription>Core platform capability configured for the CargoGuardian console.</CardDescription>
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
