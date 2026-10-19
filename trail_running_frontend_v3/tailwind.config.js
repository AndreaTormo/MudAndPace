/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#386641',
          dark: '#2A4D30'
        },
        leaf: '#DCE8B4',
        field: '#6A994E',
        moss: '#566F4B',
        olive: '#747855',
        clay: '#B08968',
        gray: {
          50: '#F7F8F2',
          100: '#ECF0DE',
          200: '#DCE8B4',
          300: '#BFCE9E',
          400: '#7F9060',
          500: '#65734C',
          600: '#566F4B',
          700: '#3E4E36',
          800: '#313D2B',
          900: '#2A3226'
        }
      }
    }
  },
  plugins: []
};
