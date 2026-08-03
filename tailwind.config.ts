import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf6",
          100: "#dcfce9",
          200: "#bbf7d3",
          300: "#86efb0",
          400: "#4ade87",
          500: "#22c565",
          600: "#16a350",
          700: "#158042",
          800: "#166537",
          900: "#14532f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
