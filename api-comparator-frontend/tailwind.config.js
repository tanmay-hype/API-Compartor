/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: '#090D16',
        glass: 'rgba(13, 19, 33, 0.72)',
        glassBorder: 'rgba(255, 255, 255, 0.10)',
        neon: {
          cyan: '#22D3EE',
          indigo: '#6366F1',
          emerald: '#10B981',
          rose: '#F43F5E',
          orange: '#F97316',
          slate: '#0F172A',
        },
      },
      boxShadow: {
        glass: '0 18px 60px rgba(2, 8, 23, 0.45)',
        neon: '0 0 0 1px rgba(34, 211, 238, 0.18), 0 0 32px rgba(34, 211, 238, 0.18)',
        orange: '0 0 0 1px rgba(249, 115, 22, 0.18), 0 0 32px rgba(249, 115, 22, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(249, 115, 22, 0.55)' },
          '70%': { boxShadow: '0 0 0 16px rgba(249, 115, 22, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(249, 115, 22, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
  plugins: [],
};
