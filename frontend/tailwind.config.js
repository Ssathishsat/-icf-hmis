/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e6edf5',
          100: '#ccdaeb',
          200: '#99b5d7',
          300: '#6690c3',
          400: '#336baf',
          500: '#003366',  // Indian Railways Blue
          600: '#002952',
          700: '#001f3d',
          800: '#001429',
          900: '#000a14',
        },
        railway: {
          blue:   '#003366',
          gold:   '#FFB300',
          green:  '#1B5E20',
          red:    '#B71C1C',
          gray:   '#546E7A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 51, 102, 0.15)',
        'card':  '0 4px 20px rgba(0, 51, 102, 0.1)',
        'hover': '0 8px 30px rgba(0, 51, 102, 0.2)',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up':   'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      backgroundImage: {
        'railway-gradient': 'linear-gradient(135deg, #003366 0%, #0066CC 100%)',
        'card-gradient':    'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,244,255,0.9) 100%)',
      }
    },
  },
  plugins: [],
}
