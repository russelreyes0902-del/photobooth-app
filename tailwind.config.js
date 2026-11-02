/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#0a0b0e',
          900: '#111318',
          800: '#191c24',
          700: '#232733',
          600: '#323748',
          500: '#484f65',
        },
        accent: {
          pink: '#ff6b95',
          purple: '#b36bff',
          cyan: '#38d9a9',
          amber: '#fcc419',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'flash': 'flashAnim 0.5s ease-out forwards',
        'shutter': 'shutterAnim 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        flashAnim: {
          '0%': { opacity: '0.95', background: 'white' },
          '100%': { opacity: '0', display: 'none' },
        },
        shutterAnim: {
          '0%': { transform: 'scale(0.96)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
