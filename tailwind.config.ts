import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: { 50: "#FDF9F7", 100: "#FAF1ED", 200: "#F6E5DF", 300: "#F0D5CC" },
        cream: { DEFAULT: "#FDF8F6", dark: "#F8EFEA" },
        sand: { 50: "#FBF5F2", 100: "#F6ECE7", 200: "#EFDFD8", 300: "#E3CCC1" },
        caramel: { 50: "#FFF3EF", 100: "#FFE4DB", 400: "#FFA593", 500: "#FB8671", 600: "#C04A34", 700: "#A63D2A" },
        bark: {
          300: "#94A6A3",
          400: "#6B7E7A",
          500: "#536461",
          600: "#41514E",
          700: "#313E3C",
          800: "#24302E",
          900: "#17211F",
        },
        leaf: { 50: "#E7F6F5", 100: "#C4EBE8", 200: "#99DBD6", 500: "#17968F", 600: "#0E8079", 700: "#0B6660" },
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
