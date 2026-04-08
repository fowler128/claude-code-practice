import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#070d18",
        panel: "#111b2e",
        line: "#2a3d5e",
        text: "#d9e7ff",
        muted: "#8ea9d7",
        critical: "#f06d86",
        warning: "#f5ba53",
        good: "#2ac790"
      }
    }
  },
  plugins: []
};

export default config;
