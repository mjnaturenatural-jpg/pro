import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: { 50: "#F8F7EC", 100: "#FDFCF4", 200: "#F0EFE2", 300: "#E5E3D2" },
        cream: { DEFAULT: "#E2F0D8", dark: "#D2E4BF" },
        sand: { 50: "#F0F4E8", 100: "#E2F0D8", 200: "#CFE2BB", 300: "#B5CCA6" },
        forest: { 700: "#22804F", 800: "#1B6B42", 900: "#176044" },
        caramel: { 50: "#FFF3EF", 100: "#FFE4DB", 300: "#FFC9BC", 400: "#FFA593", 500: "#FB8671", 600: "#C04A34", 700: "#A63D2A" },
        honey: { 50: "#FFF8E6", 100: "#FDEFC8", 200: "#F9DFA1", 300: "#F3C76B", 400: "#EDB03C", 500: "#DE9520", 600: "#B87514", 700: "#8F5A0D" },
        berry: { 50: "#FCF0F7", 100: "#FADCEE", 200: "#F5B8D8", 300: "#EF8CBB", 400: "#E55E9C", 500: "#D63384", 600: "#B01E68", 700: "#8C1450" },
        bark: {
          300: "#A89478",
          400: "#8A7454",
          500: "#6E5B40",
          600: "#5C4930",
          700: "#55432C",
          800: "#49351F",
          900: "#176044",
        },
        leaf: { 50: "#EAF5EB", 100: "#D6EBD8", 200: "#BFE0C2", 400: "#5FA869", 500: "#4A9A54", 600: "#398B43", 700: "#2E7338" },
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
