"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChartColumnIncreasing,
  Gauge,
  History,
  Map,
  MemoryStick,
  Settings,
  TrainFront
} from "lucide-react";

import { desktopNavigationItems, isRouteActive } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const icons = {
  dashboard: Gauge,
  fleet: TrainFront,
  map: Map,
  analytics: ChartColumnIncreasing,
  alerts: Bell,
  history: History,
  devices: MemoryStick,
  settings: Settings
};

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-80 shrink-0 border-r border-border/70 bg-[linear-gradient(180deg,hsl(var(--surface-low))_0%,hsl(var(--background))_100%)] lg:flex lg:flex-col">
      <div className="border-b border-border/60 px-6 py-7">
        <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-5 shadow-panel">
          <p className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            CargoGuardian
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Rail operations console
          </p>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Dashboard-first monitoring for train health, device readiness, alerts, and route context.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {desktopNavigationItems.map((item) => {
          const Icon = icons[item.icon];
          const active = isRouteActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-4 rounded-[1.25rem] px-4 py-3.5 text-sm font-semibold transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-panel"
                  : "text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-panel"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border border-transparent transition-colors",
                  active
                    ? "bg-white/12 text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:border-border/70 group-hover:bg-background group-hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{item.label}</span>
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  active ? "bg-secondary" : "bg-transparent group-hover:bg-border"
                )}
              />
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-6 py-6">
        <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Shell status</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Navigation, train context, and operator controls are now centralized in the protected shell.
          </p>
        </div>
      </div>
    </aside>
  );
}
