import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        saffron: "#d97706",
        leaf: "#15803d",
        paper: "#f8fafc"
      }
    }
  },
  plugins: []
};

export default config;
