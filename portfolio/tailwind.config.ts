// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "spin-slow": {
          from: { transform: "translate(-50%, -50%) rotate(0deg)" },
          to: { transform: "translate(-50%, -50%) rotate(360deg)" },
        },
        "spin-slower-reverse": {
          from: { transform: "translate(-50%, -50%) rotate(360deg)" },
          to: { transform: "translate(-50%, -50%) rotate(0deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.65" },
          "50%": { opacity: "0.9" },
        },
        // デザインカタログのティッカー。同じ列を2回並べ、半分動かしたところで最初に戻す
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 18s linear infinite",
        "spin-slower-reverse": "spin-slower-reverse 28s linear infinite",
        "pulse-soft": "pulse-soft 3.8s ease-in-out infinite",
        marquee: "marquee 24s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
