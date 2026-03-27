/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        moss: {
          light: '#EAF3DE',
          mid:   '#639922',
          dark:  '#3B6D11',
        },
        cream: '#FAF8F4',
        ink:   '#1C1917',
      },
    },
  },
}
