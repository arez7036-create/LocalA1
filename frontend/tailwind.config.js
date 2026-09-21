/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 500: '#10a37f', 600: '#0d8a6b', 700: '#0a6d54' },
      },
    },
  },
  plugins: [],
}