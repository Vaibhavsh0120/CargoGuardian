import type { Route } from "next";

export type AppRouteIconKey =
  | "dashboard"
  | "fleet"
  | "map"
  | "analytics"
  | "alerts"
  | "access"
  | "settings";

export type AppRouteKey = AppRouteIconKey;

export type AppRouteDefinition = {
  key: AppRouteKey;
  href: Route;
  label: string;
  mobileLabel?: string;
  icon: AppRouteIconKey;
};

export const appRouteDefinitions: Record<AppRouteKey, AppRouteDefinition> = {
  dashboard: {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard"
  },
  fleet: {
    key: "fleet",
    href: "/fleet",
    label: "Fleet",
    icon: "fleet"
  },
  map: {
    key: "map",
    href: "/map",
    label: "Map",
    icon: "map"
  },
  analytics: {
    key: "analytics",
    href: "/analytics",
    label: "Analytics",
    icon: "analytics"
  },
  alerts: {
    key: "alerts",
    href: "/alerts",
    label: "Alerts",
    icon: "alerts"
  },
  access: {
    key: "access",
    href: "/access",
    label: "Access",
    icon: "access"
  },
  settings: {
    key: "settings",
    href: "/settings",
    label: "Settings",
    mobileLabel: "More",
    icon: "settings"
  }
};

export const desktopNavigationItems = [
  appRouteDefinitions.dashboard,
  appRouteDefinitions.fleet,
  appRouteDefinitions.map,
  appRouteDefinitions.analytics,
  appRouteDefinitions.alerts,
  appRouteDefinitions.access,
  appRouteDefinitions.settings
] as const;

export const mobileNavigationItems = [
  appRouteDefinitions.dashboard,
  appRouteDefinitions.fleet,
  appRouteDefinitions.access,
  appRouteDefinitions.alerts,
  appRouteDefinitions.settings
] as const;

export function isRouteActive(pathname: string, href: Route) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
