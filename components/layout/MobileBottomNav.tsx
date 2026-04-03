"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChartColumnIncreasing,
  Gauge,
  History,
  Map,
  MemoryStick,
  Menu,
  TrainFront
} from "lucide-react";

import { isRouteActive, mobileNavigationItems } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const icons = {
  dashboard: Gauge,
  fleet: TrainFront,
  map: Map,
  analytics: ChartColumnIncreasing,
  alerts: Bell,
  history: History,
  devices: MemoryStick,
  settings: Menu
};

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 py-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-2">
        {mobileNavigationItems.map((item) => {
          const Icon = icons[item.icon];
          const active = isRouteActive(pathname, item.href as Route);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-panel"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <Icon className="mb-1 h-4 w-4" />
              {item.mobileLabel ?? item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
