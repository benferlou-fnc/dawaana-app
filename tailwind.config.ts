import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F7F4EE",
          surface: "#FFFFFF",
          ink: "#1C1E29",
          "ink-soft": "#52566A",
          "ink-faint": "#7D8092",
          border: "#E7E3DA",
          green: "#1FA35C",
          "green-dark": "#157347",
          "green-tint": "#DCF5E6",
          coral: "#F0653E",
          "coral-dark": "#C94F2E",
          "coral-tint": "#FDE7E0",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["IBM Plex Sans", "system-ui", "sans-serif"],
        arabic: ["Cairo", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
