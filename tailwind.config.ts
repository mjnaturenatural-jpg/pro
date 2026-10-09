import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: { 50: "#F9FCF7", 100: "#F1F8ED", 200: "#E5F2DE", 300: "#D4E9CB" },
        cream: { DEFAULT: "#F7FBF4", dark: "#EDF5E5" },
        sand: { 50: "#F5F9F0", 100: "#EBF2E3", 200: "#DCE7D0", 300: "#C7D7B5" },
        caramel: { 400: "#F2B33E", 500: "#E09A21", 600: "#996610", 700: "#7C520C" },
        bark: {
          300: "#97A69A",
          400: "#6E7F71",
          500: "#57685B",
          600: "#435145",
          700: "#323E35",
          800: "#242F27",
          900: "#18211B",
        },
        leaf: { 50: "#EFF8EC", 100: "#DCF2D6", 200: "#B9E4B0", 500: "#43A047", 600: "#35863A", 700: "#2A6B2E" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px -4px rgba(24, 33, 27, 0.08)",
        lift: "0 8px 30px -8px rgba(24, 33, 27, 0.16)",
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
