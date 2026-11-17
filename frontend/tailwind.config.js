/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)'
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        night: 'rgb(var(--night) / <alpha-value>)',
        night2: 'rgb(var(--night-2) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        leaf: '#D7E0CB',
        field: '#6F8A63',
        moss: '#5A6B50',
        olive: '#747A5C',
        clay: '#C99472',
        forest: '#2F4A1E',
        cream: '#F4F1E8',
        paper: '#ECE8DC',
        mud: '#7A4A2E',
        green: {
          50: '#EEF3EA',
          100: '#DEE8D6',
          200: '#C8D8BE',
          300: '#AAC4A0',
          400: '#86A97F',
          500: '#648A5F',
          600: '#4C6E48',
          700: '#3A5838',
          800: '#304A2F',
          900: '#293F28',
          950: '#142314'
        },
        blue: {
          50: '#EEF1F3',
          100: '#E0E6E9',
          200: '#CAD6DC',
          300: '#AABEC8',
          400: '#829DAB',
          500: '#637F8E',
          600: '#4E6875',
          700: '#3F5560',
          800: '#354852',
          900: '#2E3E46',
          950: '#182329'
        },
        amber: {
          50: '#F8F2E3',
          100: '#F1E4C6',
          200: '#E4D1A3',
          300: '#D4B77A',
          400: '#C09A52',
          500: '#A87F39',
          600: '#8E652B',
          700: '#745022',
          800: '#5F421D',
          900: '#50381A',
          950: '#2D1F0D'
        },
        red: {
          50: '#F9EDEA',
          100: '#F3DBD7',
          200: '#E8C3BC',
          300: '#D9A49B',
          400: '#C87F74',
          500: '#B66257',
          600: '#A34E45',
          700: '#883F37',
          800: '#71332D',
          900: '#5D2A25',
          950: '#391815'
        },
        rose: {
          50: '#F9EDEA',
          100: '#F3DBD7',
          200: '#E8C3BC',
          300: '#D9A49B',
          400: '#C87F74',
          500: '#B66257',
          600: '#A34E45',
          700: '#883F37',
          800: '#71332D',
          900: '#5D2A25',
          950: '#391815'
        },
        indigo: {
          50: '#EDEEF1',
          100: '#DFE1E7',
          200: '#C8CCD6',
          300: '#A5ABBB',
          400: '#7F879D',
          500: '#626B82',
          600: '#4E566B',
          700: '#424959',
          800: '#383E4C',
          900: '#313642',
          950: '#1E2128'
        },
        gray: {
          50: 'rgb(var(--gray-50) / <alpha-value>)',
          100: 'rgb(var(--gray-100) / <alpha-value>)',
          200: 'rgb(var(--gray-200) / <alpha-value>)',
          300: 'rgb(var(--gray-300) / <alpha-value>)',
          400: 'rgb(var(--gray-400) / <alpha-value>)',
          500: 'rgb(var(--gray-500) / <alpha-value>)',
          600: 'rgb(var(--gray-600) / <alpha-value>)',
          700: 'rgb(var(--gray-700) / <alpha-value>)',
          800: 'rgb(var(--gray-800) / <alpha-value>)',
          900: 'rgb(var(--gray-900) / <alpha-value>)'
        }
      },
      fontFamily: {
        display: ['"Roboto Slab"', 'Georgia', 'serif']
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem'
      }
    }
  },
  plugins: []
};
