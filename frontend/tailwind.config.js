/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#FAF9F6", // Luxury Warm Cream
        surface: "#FFFFFF", // Pure White Card
        cyan: "#000000", // Pure Black
        violet: "#C5B49E", // Warm Beige / Sand
        emerald: "#E5DCCB", // Soft Sand
        amber: "#D4C5B9", // Taupe / Beige
        danger: "#BCAAA4", // Tan / Kraft
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(197, 180, 158, 0.08)",
        "glow-violet": "0 0 24px rgba(197, 180, 158, 0.08)",
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 },
        }
      },
      animation: {
        pulseDot: 'pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
