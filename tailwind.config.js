/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        line: {
          green: '#06C755',
          dark: '#00B900',
          header: '#00C300',
          bg: '#F5F5F5',
          bubble: '#FFFFFF',
          chat: '#DCF8C6',
        }
      }
    },
  },
  plugins: [],
}
