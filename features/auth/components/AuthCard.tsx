import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  badgeLabel,
  title,
  description,
  children
}: Readonly<{
  badgeLabel?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <Card className="w-full max-w-md border-white/60 shadow-ambient">
      <CardHeader className="space-y-4">
        {badgeLabel ? <Badge className="w-fit">{badgeLabel}</Badge> : null}
        <div className="space-y-2">
          <CardTitle className="font-display text-3xl text-foreground">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
