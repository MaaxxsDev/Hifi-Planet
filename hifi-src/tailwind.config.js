/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5fbee',
          100: '#e9f6da',
          200: '#d3eeb4',
          300: '#b6e382',
          400: '#92d444',
          500: '#6ba626',
          600: '#58891f',
          700: '#48701a',
          800: '#3b5b15',
          900: '#304b11',
        },
      },
    },
  },
  plugins: [],
};
