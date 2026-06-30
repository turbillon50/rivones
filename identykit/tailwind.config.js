/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08080c",
        accent: "#1FD1B8",
        "accent-dark": "#149D90"
      }
    }
  },
  plugins: []
}
