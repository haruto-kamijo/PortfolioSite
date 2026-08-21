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
      },
      animation: {
        "spin-slow": "spin-slow 18s linear infinite",
        "spin-slower-reverse": "spin-slower-reverse 28s linear infinite",
        "pulse-soft": "pulse-soft 3.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
