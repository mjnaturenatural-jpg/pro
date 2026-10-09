import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: { 50: "#052E22", 100: "#07382A", 200: "#0A4234", 300: "#0D4C3C" },
        cream: { DEFAULT: "#063428", dark: "#04291E" },
        sand: { 50: "#08402F", 100: "#0A4A38", 200: "#0E5541", 300: "#12604A" },
        forest: { 700: "#0A4A36", 800: "#063A2A", 900: "#04291E" },
        caramel: { 50: "#FFF3EF", 100: "#FFE4DB", 300: "#FFC9BC", 400: "#FFA593", 500: "#FB8671", 600: "#C04A34", 700: "#A63D2A" },
        honey: { 50: "#FFF8E6", 100: "#FDEFC8", 200: "#F9DFA1", 300: "#F3C76B", 400: "#EDB03C", 500: "#DE9520", 600: "#B87514", 700: "#8F5A0D" },
        berry: { 50: "#FCF0F7", 100: "#FADCEE", 200: "#F5B8D8", 300: "#EF8CBB", 400: "#E55E9C", 500: "#D63384", 600: "#B01E68", 700: "#8C1450" },
        bark: {
          300: "#6E8580",
          400: "#9FB1AB",
          500: "#B3C3BD",
          600: "#C8D6D0",
          700: "#D9E4DF",
          800: "#E7F0EB",
          900: "#F3F8F6",
        },
        leaf: { 50: "#E7F6F5", 100: "#C4EBE8", 200: "#99DBD6", 400: "#2FB5AA", 500: "#17968F", 600: "#0E8079", 700: "#0B6660" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px -4px rgba(0, 0, 0, 0.45)",
        lift: "0 8px 30px -8px rgba(0, 0, 0, 0.55)",
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
