import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14151f',
        paper: '#fbfaf7',
        plum: '#5c2d66',
        coral: '#ec5d4f',
        sea: '#0f8f8a',
        citron: '#e8c547',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(20, 21, 31, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
