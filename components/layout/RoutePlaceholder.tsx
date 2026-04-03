import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoutePlaceholder({
  eyebrow,
  title,
  description
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>) {
  return (
    <Card className="max-w-3xl border-white/70 shadow-panel">
      <CardHeader className="space-y-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
          {eyebrow}
        </p>
        <CardTitle className="font-display text-3xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
