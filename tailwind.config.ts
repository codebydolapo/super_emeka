import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["'Press Start 2P'", "monospace"],
      },
      colors: {
        naija: {
          green: "#008751",
          "green-dark": "#00532f",
          yellow: "#ffd400",
          orange: "#ff7a00",
        },
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "float-up": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-20px)", opacity: "0" },
        },
      },
      animation: {
        blink: "blink 1s step-start infinite",
        "float-up": "float-up 0.8s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
