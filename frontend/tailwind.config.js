/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1a3c2b",
        moss: "#2d6a4f",
        sage: "#74c69d",
        pale: "#d8f3dc",
        cream: "#faf7f2",
        gold: "#c9a84c",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
        mono: ["'Courier New'", "monospace"]
      }
    }
  },
  plugins: []
}
