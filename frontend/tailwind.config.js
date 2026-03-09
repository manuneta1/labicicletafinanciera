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
        bicicleta: {
          bg: '#0a0a0f',
          surface: '#13131a',
          surface2: '#1c1c26',
          border: '#2a2a3d',
          accent: '#7c6af7',
          'accent-light': '#a394ff',
          'accent-glow': 'rgba(124, 106, 247, 0.15)',
          text: '#f0f0f8',
          'text-muted': '#8080a0',
          'text-dim': '#4a4a6a',
          success: '#4ade80',
          error: '#f87171',
        },
      },
    },
  },
  plugins: [],
}
