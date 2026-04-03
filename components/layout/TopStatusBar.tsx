import { Bell, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopStatusBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="border-white/60 bg-card pl-9"
            placeholder="Search trains, routes, or device IDs..."
            disabled
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Badge variant="outline" className="hidden gap-2 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Foundation ready
          </Badge>
          <Button size="icon" variant="ghost" disabled aria-label="Notifications placeholder">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
