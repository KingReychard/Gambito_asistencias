/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gambito: {
          green: '#78c841',
          'green-dark': '#5fa832',
          orange: '#ff9b2f',
          'orange-dark': '#e8871a',
          dark: '#1a1a1a',
          gray: '#6B7280',
          light: '#f8f9fa',
          red: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
