import type { Metadata, Viewport } from "next";

import "./globals.css";

import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "CargoGuardian",
  description: "Rail cargo monitoring dashboard for live telemetry, alerts, and analytics.",
  applicationName: "CargoGuardian",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CargoGuardian"
  },
  icons: {
    icon: "/icons/logo.png",
    apple: "/icons/logo.png",
    shortcut: "/icons/logo.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f3eb"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
