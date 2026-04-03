import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md border-white/60 shadow-ambient">
      <CardHeader className="space-y-4">
        <Badge className="w-fit">Phase 1 Placeholder</Badge>
        <div className="space-y-2">
          <CardTitle className="font-display text-3xl text-foreground">Signup</CardTitle>
          <CardDescription>
            Account creation arrives in Phase 2. This route is present now so the auth flow can be
            styled and verified early.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Full name" disabled />
        <Input type="email" placeholder="operator@cargoguardian.dev" disabled />
        <Input type="password" placeholder="Create a password" disabled />
        <Button className="w-full" disabled>
          Create account in Phase 2
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have access?{" "}
          <Link className="font-medium text-primary" href="/login">
            Return to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
