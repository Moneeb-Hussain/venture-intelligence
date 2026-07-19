import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      // Semantic colors (common-sense): indigo = brand/interactive,
      // emerald = supported/approve, red = contradicted/reject/attack,
      // amber = attention. Always paired with a label, never color alone.
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.05)",
        panel: "0 1px 3px 0 rgb(16 24 40 / 0.06), 0 1px 2px -1px rgb(16 24 40 / 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
