import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutral "ink" scale — remapped to a haunted-dungeon night palette.
        // Low numbers = light parchment text, high numbers = deep purple-black,
        // so the existing dark-on-top component markup stays readable.
        ink: {
          50: "#fffdf0",
          100: "#f4ecd2",
          200: "#e3d3a6",
          300: "#cbbce8",
          400: "#a294cf",
          500: "#7e6fae",
          600: "#5a4a86",
          700: "#46357a",
          800: "#2e2150",
          900: "#190f33",
          950: "#0c0620",
        },
        // "brand" = treasure gold / dragonfire orange.
        brand: {
          50: "#fffbe6",
          100: "#fff3bf",
          200: "#ffe88a",
          300: "#ffd95c",
          400: "#ffcc33",
          500: "#f5a623",
          600: "#e0820a",
          700: "#b35f00",
          800: "#8a4700",
          900: "#5c2f00",
          950: "#2e1700",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Trebuchet MS", "Verdana", "sans-serif"],
        display: ["var(--font-display)", "Papyrus", "fantasy"],
        retro: ['"Comic Sans MS"', '"Comic Sans"', "cursive"],
      },
      keyframes: {
        blink: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        sparkle: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".35", transform: "scale(.85)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-6deg)" },
          "50%": { transform: "rotate(6deg)" },
        },
        spinslow: { to: { transform: "rotate(360deg)" } },
        glowpulse: {
          "0%,100%": { textShadow: "1px 1px 0 #000, 0 0 8px #f5a623" },
          "50%": {
            textShadow: "1px 1px 0 #000, 0 0 18px #ffd95c, 0 0 28px #f5a623",
          },
        },
        barberpole: { to: { backgroundPosition: "40px 0" } },
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        marquee: "marquee 20s linear infinite",
        sparkle: "sparkle 1.6s ease-in-out infinite",
        wiggle: "wiggle 1.2s ease-in-out infinite",
        "spin-slow": "spinslow 7s linear infinite",
        glow: "glowpulse 2.2s ease-in-out infinite",
        barberpole: "barberpole .5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
