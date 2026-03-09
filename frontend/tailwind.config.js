/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#0f0e0c',
        'primary-surface': '#1a1916',
        'primary-border': '#2e2c28',
        'primary-accent': '#c9a84c',
        'primary-text': '#f0ece4',
      },
    },
  },
  plugins: [],
}
