import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAF7F2",
        surface: "#FFFFFF",
        ink: "#211D17",
        muted: "#7A7263",
        line: "#E7DFD0",
        accent: {
          DEFAULT: "#2F6F5E",
          hover: "#255A4C",
          soft: "#E4EEEA",
        },
        warm: {
          DEFAULT: "#C1712E",
          soft: "#F5E7D6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(33, 29, 23, 0.04), 0 4px 12px rgba(33, 29, 23, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
