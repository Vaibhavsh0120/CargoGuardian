import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1440px"
      }
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        "surface-low": "hsl(var(--surface-low))",
        "surface-high": "hsl(var(--surface-high))",
        "surface-panel": "hsl(var(--surface-panel))"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "\"SF Pro Text\"",
          "\"SF Pro Display\"",
          "\"Segoe UI\"",
          "system-ui",
          "sans-serif"
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "\"SF Pro Display\"",
          "\"SF Pro Text\"",
          "\"Segoe UI\"",
          "system-ui",
          "sans-serif"
        ],
        editorial: [
          "-apple-system",
          "BlinkMacSystemFont",
          "\"SF Pro Display\"",
          "\"SF Pro Text\"",
          "\"Segoe UI\"",
          "system-ui",
          "sans-serif"
        ],
        landing: [
          "-apple-system",
          "BlinkMacSystemFont",
          "\"SF Pro Text\"",
          "\"SF Pro Display\"",
          "\"Segoe UI\"",
          "system-ui",
          "sans-serif"
        ],
        mono: ["ui-monospace", "\"SF Mono\"", "SFMono-Regular", "Menlo", "monospace"]
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)"
      },
      boxShadow: {
        ambient: "0 16px 48px rgba(9, 29, 46, 0.08)",
        panel: "0 10px 30px rgba(9, 29, 46, 0.06)"
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-deep)) 100%)"
      }
    }
  },
  plugins: []
};

export default config;
