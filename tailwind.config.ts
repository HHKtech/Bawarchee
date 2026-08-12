import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8eb',
          100: '#fdecc8',
          500: '#f59e0b',
          600: '#d97706'
        }
      }
    }
  },
  plugins: []
};

export default config;
