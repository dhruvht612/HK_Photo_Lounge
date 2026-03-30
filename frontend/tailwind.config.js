/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0b',
          900: '#121214',
          800: '#1a1a1e',
          700: '#2a2a30',
        },
        sand: {
          50: '#faf8f5',
          100: '#f3efe8',
          200: '#e8dfd2',
        },
        accent: {
          DEFAULT: '#c9a962',
          muted: '#a68b4b',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        /* Optional — very subtle; prefer body gradients in index.css to avoid stitch seams */
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.014'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
