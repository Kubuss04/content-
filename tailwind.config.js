/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#09090b", 900: "#0f0f12", 800: "#17171c", 700: "#222229", 600: "#2e2e37" },
        copper: { 200: "#f3d3b6", 300: "#e9b893", 400: "#d99b6c", 500: "#c8875a", 600: "#a86a41", 700: "#7d4c2c" },
        bone: { 50: "#f7f3ee", 100: "#ede7e1", 200: "#ddd6cf", 300: "#c9c2ba", 400: "#a8a199" },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      maxWidth: { site: "84rem" },
    },
  },
  plugins: [],
};
