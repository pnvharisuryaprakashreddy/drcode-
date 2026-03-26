import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0D0D0D",
        paper: "#F5F0E8",
        surface: "#1A1A1A",
        border: "#2A2A2A",
        amber: "#F5A623",
        "amber-dim": "#8A5E14",
        slate: "#6B6B6B",
        danger: "#E85B5B",
        green: "#57E389"
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
        body: ["Literata", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

