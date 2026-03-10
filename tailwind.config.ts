import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        "neon-violet": "#a855ff",
        "neon-blue": "#22d3ee",
        "rich-black": "#020617"
      },
      fontFamily: {
        display: ["system-ui", "sans-serif"]
      },
      boxShadow: {
        "neon-violet": "0 0 35px rgba(168, 85, 255, 0.95)",
        "neon-blue": "0 0 35px rgba(34, 211, 238, 0.95)"
      }
    }
  },
  plugins: []
};

export default config;

