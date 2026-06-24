import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium "battle" theme (Phase B — matches /interface artwork).
        ink: {
          950: '#070510',
          900: '#0b0816',
          850: '#100b1f',
          800: '#161029',
          700: '#1e1736',
          600: '#2a2147',
        },
        brand: {
          violet: '#8b5cf6',
          'violet-light': '#a855f7',
          'violet-deep': '#6d28d9',
          gold: '#e8b339',
          'gold-light': '#f5d272',
          'gold-deep': '#c9962a',
        },
        // CoachScore grade palette — score reveal + flex card.
        grade: {
          s: '#f59e0b',
          a: '#22c55e',
          b: '#84cc16',
          c: '#eab308',
          d: '#f97316',
          f: '#ef4444',
        },
      },
      fontFamily: {
        display: [
          'var(--font-display)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        'glow-violet': '0 0 45px -8px rgba(139,92,246,0.55)',
        'glow-violet-sm': '0 0 22px -6px rgba(139,92,246,0.55)',
        'glow-gold': '0 0 45px -8px rgba(232,179,57,0.5)',
        'glow-gold-sm': '0 0 22px -6px rgba(232,179,57,0.5)',
        panel: '0 18px 50px -20px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg,#f5d272 0%,#e8b339 45%,#c9962a 100%)',
        'violet-gradient': 'linear-gradient(135deg,#a855f7 0%,#7c3aed 100%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%,100%': { opacity: '0.85', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.18)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'count-up': 'count-up 0.5s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
