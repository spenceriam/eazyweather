/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#364247",
          dark: "#2a3337",
          light: "#4a5459",
          lighter: "#e8eaeb",
          cream: "#f9f6ee",
        },
      },
    },
  },
  plugins: [],
};
