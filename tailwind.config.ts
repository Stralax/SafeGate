import type { Config } from "tailwindcss";

// SafeGate design tokens — mirrors design.md §1 "Status-Driven" palette.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic aliases so components read like design.md
        safegate: {
          bg: "#020617",         // Slate-950 — deep matte background
          surface: "#0f172a",    // Slate-900 — cards / game containers
          primary: "#22d3ee",    // Cyan-400 — "SafeGate Glow"
          success: "#10b981",    // Emerald-500 — Tier 1 Approved
          warning: "#fbbf24",    // Amber-400 — Tier 2 Recalibrate
          danger: "#e11d48",     // Rose-600 — Tier 3 Denied
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        // design.md §2 — active-game glow
        glow: "0 0 20px rgba(34, 211, 238, 0.3)",
        "glow-success": "0 0 28px rgba(16, 185, 129, 0.35)",
        "glow-danger": "0 0 28px rgba(225, 29, 72, 0.45)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-8px)" },
          "75%": { transform: "translateX(8px)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 1.2s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
