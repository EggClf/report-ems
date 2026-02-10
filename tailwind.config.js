/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f4',
          100: '#fde6e9',
          200: '#fbd0d8',
          300: '#f7a7b7',
          400: '#f27391',
          500: '#e8416f',
          600: '#EE0434',
          700: '#c4032c',
          800: '#a30527',
          900: '#8b0925',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
