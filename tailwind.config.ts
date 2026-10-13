import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: { 50: "#FDFAF5", 100: "#FFFFFF", 200: "#F8F2E8", 300: "#EAE0CE" },
        cream: { DEFAULT: "#F8F2E8", dark: "#EADFC8" },
        sand: { 50: "#F8F2E8", 100: "#F0F7EB", 200: "#DDEECE", 300: "#A8C98A" },
        forest: { 700: "#245D36", 800: "#173F2B", 900: "#0F2A1D" },
        caramel: { 50: "#FEF0EE", 100: "#FCD5CF", 300: "#F59080", 400: "#EE6A52", 500: "#E04F38", 600: "#C53E1F", 700: "#A92F17" },
        honey: { 50: "#FFF8E6", 100: "#FDEFC8", 200: "#F9DFA1", 300: "#F3C76B", 400: "#EDB03C", 500: "#DE9520", 600: "#B87514", 700: "#8F5A0D" },
        berry: { 50: "#FCF0F7", 100: "#FADCEE", 200: "#F5B8D8", 300: "#EF8CBB", 400: "#E55E9C", 500: "#D63384", 600: "#B01E68", 700: "#8C1450" },
        bark: {
          300: "#C4B49C",
          400: "#9A8468",
          500: "#6E5B45",
          600: "#55463F",
          700: "#3A2E28",
          800: "#2C221E",
          900: "#1A1208",
        },
        leaf: { 50: "#F0F7EB", 100: "#DDEECE", 200: "#C2E0AC", 400: "#72A84E", 500: "#5C9440", 600: "#4A7832", 700: "#3A6128" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px -4px rgba(23, 33, 31, 0.08)",
        lift: "0 8px 30px -8px rgba(23, 33, 31, 0.16)",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: { fadeUp: "fadeUp 0.5s ease-out", fadeIn: "fadeIn 0.3s ease-out" },
    },
  },
  plugins: [],
};
export default config;
