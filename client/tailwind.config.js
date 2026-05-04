/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0d0d1a',
        'bg-surface': '#1a1a2e',
        'bg-surface-2': '#16213e',
        'accent': '#7c3aed',
        'accent-light': '#a78bfa',
        'accent-glow': '#4c1d95',
        'text-primary': '#f1f0ff',
        'text-muted': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
