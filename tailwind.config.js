/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ea580c',
          light: '#fff7ed',
          dark: '#f97316',
        },
        obsidian: {
          bg: '#111315',
          surface: '#181a1c',
          card: '#14171a',
          border: '#2c3034',
        }
      },
      fontFamily: {
        karla: ['Karla', 'system-ui', 'sans-serif'],
        doto: ['Doto', 'monospace'],
        silkscreen: ['Silkscreen', 'monospace'],
        mono: ['Space Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}

