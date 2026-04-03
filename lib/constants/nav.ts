import type { Route } from "next";

export const navigationItems = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: "dashboard" as const },
  { href: "/fleet" as Route, label: "Fleet", icon: "fleet" as const },
  { href: "/map" as Route, label: "Map", icon: "map" as const },
  { href: "/analytics" as Route, label: "Analytics", icon: "analytics" as const },
  { href: "/alerts" as Route, label: "Alerts", icon: "alerts" as const },
  { href: "/history" as Route, label: "History", icon: "history" as const },
  { href: "/devices" as Route, label: "Devices", icon: "devices" as const },
  { href: "/settings" as Route, label: "Settings", icon: "settings" as const }
];
