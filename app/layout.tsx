import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

import "./globals.css";

import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  title: "CargoGuardian",
  description: "Rail cargo monitoring dashboard for live telemetry, alerts, and analytics."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} min-h-screen bg-background`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
