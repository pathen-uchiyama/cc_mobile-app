import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        parchment: "hsl(var(--parchment))",
        obsidian: "hsl(var(--obsidian))",
        gold: "hsl(var(--gold))",
        highlighter: {
          DEFAULT: "hsl(var(--highlighter))",
          soft: "hsl(var(--highlighter-soft))",
        },
        magenta: "hsl(var(--magenta))",
        thistle: "hsl(var(--thistle))",
        "slate-plaid": "hsl(var(--slate-plaid))",
        "slate-divider": "hsl(var(--slate-divider) / 0.15)",
        sienna: "hsl(var(--sienna))",
        // "Ghost border" — felt, not seen. 15% per editorial guide §4.
        border: "hsl(var(--border) / 0.15)",
        input: "hsl(var(--input) / 0.15)",
        "outline-variant": "hsl(var(--outline-variant) / 0.15)",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ── Tonal surface ladder ───────────────────────────────────
        surface: {
          DEFAULT: "hsl(var(--surface))",
          lowest: "hsl(var(--surface-container-lowest))",
          low: "hsl(var(--surface-container-low))",
          DEFAULT_container: "hsl(var(--surface-container))",
          high: "hsl(var(--surface-container-high))",
          highest: "hsl(var(--surface-container-highest))",
        },
        "on-surface": "hsl(var(--on-surface))",
        "on-surface-variant": "hsl(var(--on-surface-variant))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          container: "hsl(var(--primary-container))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          container: "hsl(var(--secondary-container))",
          "fixed-dim": "hsl(var(--secondary-fixed-dim))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
          container: "hsl(var(--tertiary-container))",
          fixed: "hsl(var(--tertiary-fixed))",
          "on-fixed-variant": "hsl(var(--on-tertiary-fixed-variant))",
        },
        "on-secondary-container": "hsl(var(--on-secondary-container))",
        error: {
          DEFAULT: "hsl(var(--error))",
          container: "hsl(var(--error-container))",
          "on-container": "hsl(var(--on-error-container))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        // Editorial pairing — see The Digital Plaid Editorial Guide §3.
        display: ["Epilogue", "Plus Jakarta Sans", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Bespoke radii — favor xl/lg over the standard 0.5rem default.
        xl: "var(--radius)",                /* 1rem — interactive cards */
        lg: "var(--radius-lg)",             /* 1.25rem — sectioning */
        md: "var(--radius-md)",             /* 0.75rem — buttons */
        sm: "calc(var(--radius-md) - 0.25rem)",
      },
      boxShadow: {
        // Ambient editorial shadows — tinted with on-surface, never pure black.
        boutique: "0 12px 32px rgba(28, 28, 23, 0.06)",
        "boutique-hover": "0 18px 44px rgba(28, 28, 23, 0.09)",
        ambient: "0 12px 32px rgba(28, 28, 23, 0.06)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-container)) 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
