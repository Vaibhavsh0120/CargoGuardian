import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md border-white/60 shadow-ambient">
      <CardHeader className="space-y-4">
        <Badge className="w-fit">Phase 1 Placeholder</Badge>
        <div className="space-y-2">
          <CardTitle className="font-display text-3xl text-foreground">Login</CardTitle>
          <CardDescription>
            Firebase Auth is added in Phase 2. This placeholder proves the route, styling, and
            providers are wired correctly.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="email" placeholder="operator@cargoguardian.dev" disabled />
        <Input type="password" placeholder="Password" disabled />
        <Button className="w-full" disabled>
          Sign in in Phase 2
        </Button>
        <p className="text-sm text-muted-foreground">
          Need an account?{" "}
          <Link className="font-medium text-primary" href="/signup">
            Open signup
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
