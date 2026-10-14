import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: { 50: "#FDFAF5", 100: "#FFFFFF", 200: "#F8F2E8", 300: "#EAE0CE" },
        cream: { DEFAULT: "#FDFAF5", dark: "#F3E9D8" },
        sand: { 50: "#FAF5EB", 100: "#F3E9D8", 200: "#E7D6B8", 300: "#D5BC93" },
        brown: { 700: "#5A3A20", 800: "#4A2C15", 900: "#3B2314" },
        forest: { 700: "#3E5A2A", 800: "#2E4420", 900: "#1E2E15" },
        caramel: { 50: "#FBF3E8", 100: "#F5E3C8", 300: "#E5B96F", 400: "#D99A3F", 500: "#C8782A", 600: "#A8621F", 700: "#7E4A17" },
        turmeric: { 300: "#F2C95C", 400: "#E3A52B", 500: "#C98F1B", 600: "#8A6414" },
        honey: { 50: "#FFF8E6", 100: "#FDEFC8", 200: "#F9DFA1", 300: "#F3C76B", 400: "#EDB03C", 500: "#DE9520", 600: "#B87514", 700: "#8F5A0D" },
        berry: { 50: "#FCF0F7", 100: "#FADCEE", 200: "#F5B8D8", 300: "#EF8CBB", 400: "#E55E9C", 500: "#D63384", 600: "#B01E68", 700: "#8C1450" },
        bark: {
          300: "#C9B79F",
          400: "#A68B6E",
          500: "#6B5848",
          600: "#544334",
          700: "#413122",
          800: "#33261B",
          900: "#241A12",
        },
        leaf: { 50: "#F1F5E9", 100: "#DDE8CC", 200: "#C2D3A6", 400: "#7A9455", 500: "#647D42", 600: "#4F6B3A", 700: "#43602F", 800: "#2F4A22", 900: "#22331A" },
        chilli: { 50: "#FBF0EB", 100: "#F6D9D2", 500: "#C24A35", 600: "#B23A2B", 700: "#93301F" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px -4px rgba(59, 35, 20, 0.10)",
        lift: "0 10px 34px -10px rgba(59, 35, 20, 0.22)",
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
