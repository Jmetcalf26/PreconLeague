import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d4d9e3",
          300: "#aeb7ca",
          400: "#8290ab",
          500: "#617090",
          600: "#4c5876",
          700: "#3e4860",
          800: "#363e51",
          900: "#1d2230",
          950: "#0f121b",
        },
        brand: {
          50: "#fef5ee",
          100: "#fde8d7",
          200: "#facdad",
          300: "#f6a979",
          400: "#f17b43",
          500: "#ed591f",
          600: "#de4015",
          700: "#b82e14",
          800: "#922618",
          900: "#762217",
          950: "#400e0a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
