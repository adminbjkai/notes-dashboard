import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0a0a0b",
          surface: "#111113",
          elevated: "#18181b",
          border: "#27272a",
          muted: "#3f3f46",
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
