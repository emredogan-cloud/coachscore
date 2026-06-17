import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CoachScore grade palette — used by the score reveal and flex card.
        grade: {
          s: '#f59e0b',
          a: '#22c55e',
          b: '#84cc16',
          c: '#eab308',
          d: '#f97316',
          f: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
