/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#0D1117",
        card: "#12171F",
        surface: "#151B23",
        line: "#1F2937",
        ink: "#E6E9EE",
        muted: "#94A3B8",
        faint: "#64748B",
        accent: "#5FA8A0",
      },
      boxShadow: {
        inset: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
