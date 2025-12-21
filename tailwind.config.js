/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#111827',
          'card': 'rgba(31,41,55,0.5)', // midnight charcoal with opacity fallback
          'mid': '#1f2937',
        },
        accent: {
          violet: '#8b5cf6',
          pink: '#ec4899',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '80%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'shimmer-x': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'fade-shrink': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.96)' }
        }
      },
      animation: {
        'pop-in': 'pop-in 220ms cubic-bezier(.2,.9,.2,1)',
        'fade': 'fade 300ms ease-in-out',
        'shimmer-x': 'shimmer-x 1.8s linear infinite',
        'fade-shrink': 'fade-shrink 240ms ease-in-out'
      }
    },
  },
  plugins: [],
}