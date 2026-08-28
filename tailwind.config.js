/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: '#0A0A0A',
        graphite: {
          DEFAULT: '#16161A',
          2: '#1E1E24',
          3: '#2A2A31',
        },
        steel: '#8A8A93',
        'pharos-red': {
          DEFAULT: '#E10600',
          dark: '#B00500',
          dim: '#7A0400',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        '7xl': '80rem',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
        '900': '900ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth-out': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
  },
  plugins: [],
};
