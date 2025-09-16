/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f8ff',
          500: '#0e6fff',
          600: '#0a56c2',
          700: '#083f8f'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}


