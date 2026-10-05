/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#263D3C',
        'brand-deep': '#004838',
        'brand-sec': '#0A5C4B',
        'brand-offwhite': '#EBEDE8',
        'brand-bg': '#F7F8F6',
        'brand-border': '#D7DAD2',
        'brand-primary': '#163B35',
        'brand-secondary': '#53615D',
        'brand-lime': '#C8E86B',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
