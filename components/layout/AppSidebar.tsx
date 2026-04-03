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

import { navigationItems } from "@/lib/constants/nav";
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
    <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-surface-low lg:flex lg:flex-col">
      <div className="border-b border-border/60 px-6 py-6">
        <p className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          CargoGuardian
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          System Operator
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigationItems.map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-panel"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-6 py-5 text-xs text-muted-foreground">
        Rail cargo monitoring console
      </div>
    </aside>
  );
}
