import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: { 50: "#EAF6EF", 100: "#F3FAF6", 200: "#E1F2E8", 300: "#D5ECE0" },
        cream: { DEFAULT: "#F0F9F4", dark: "#E3F3EA" },
        sand: { 50: "#EDF7F1", 100: "#E5F4EB", 200: "#D9EFE2", 300: "#CCE9D8" },
        forest: { 700: "#2E8169", 800: "#22705A", 900: "#16604A" },
        caramel: { 50: "#FFF3EF", 100: "#FFE4DB", 300: "#FFC9BC", 400: "#FFA593", 500: "#FB8671", 600: "#C04A34", 700: "#A63D2A" },
        honey: { 50: "#FFF8E6", 100: "#FDEFC8", 200: "#F9DFA1", 300: "#F3C76B", 400: "#EDB03C", 500: "#DE9520", 600: "#B87514", 700: "#8F5A0D" },
        berry: { 50: "#FCF0F7", 100: "#FADCEE", 200: "#F5B8D8", 300: "#EF8CBB", 400: "#E55E9C", 500: "#D63384", 600: "#B01E68", 700: "#8C1450" },
        bark: {
          300: "#94A6A3",
          400: "#6B7E7A",
          500: "#536461",
          600: "#41514E",
          700: "#313E3C",
          800: "#24302E",
          900: "#17211F",
        },
        leaf: { 50: "#E7F6F5", 100: "#C4EBE8", 200: "#99DBD6", 400: "#2FB5AA", 500: "#17968F", 600: "#0E8079", 700: "#0B6660" },
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
