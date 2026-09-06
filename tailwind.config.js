/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Azul/navy corporativo Interseguro: estructura, navegación, interacción principal.
        primary: {
          50: '#f2f7fd',
          100: '#e4effb',
          200: '#c1d9f6',
          300: '#8cb8ee',
          400: '#4e92e4',
          500: '#1f6ecc',
          600: '#1a5dad',
          700: '#13437c',
          800: '#0e325d',
          900: '#0a2443',
        },
        // Turquesa/cian corporativo Interseguro: acentos, indicadores, elementos destacados (con moderación).
        secondary: {
          50: '#f0fbff',
          100: '#e0f8ff',
          200: '#b8eeff',
          300: '#7adfff',
          400: '#33cdff',
          500: '#009ed1',
          600: '#008bb8',
          700: '#006c8f',
          800: '#00516b',
          900: '#003a4d',
        },
        // Alias retro-compatible: el token anterior "brand" pasa a apuntar al azul primario.
        brand: {
          50: '#f2f7fd',
          100: '#e4effb',
          200: '#c1d9f6',
          300: '#8cb8ee',
          400: '#4e92e4',
          500: '#1f6ecc',
          600: '#1a5dad',
          700: '#13437c',
          800: '#0e325d',
          900: '#0a2443',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover': '0 4px 8px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
