"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Bell, Gauge, Map, Menu, TrainFront } from "lucide-react";

import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: Gauge },
  { href: "/fleet" as Route, label: "Fleet", icon: TrainFront },
  { href: "/map" as Route, label: "Map", icon: Map },
  { href: "/alerts" as Route, label: "Alerts", icon: Bell },
  { href: "/settings" as Route, label: "More", icon: Menu }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 py-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-2">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <Icon className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
