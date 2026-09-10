import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FemVents Brand Colors
        primary: {
          50: '#f4f1f9',
          100: '#e7e0f1',
          200: '#cbb9df',
          300: '#a98fc9',
          400: '#8267ac',
          500: '#5A4485', // Brand indigo — from logo
          600: '#4A3770',
          700: '#3d2d5c',
          800: '#302449',
          900: '#251b38',
        },
        secondary: {
          50: '#fbeef3',
          100: '#f6d9e4',
          200: '#eba9c2',
          300: '#d97ca0',
          400: '#c04d7d',
          500: '#A82C60', // Brand magenta — from logo
          600: '#8F2451',
          700: '#761c42',
          800: '#5e1734',
          900: '#471027',
        },
        accent: {
          50: '#fdf1ee',
          100: '#fbdcd3',
          200: '#f5b5a4',
          300: '#ec8d75',
          400: '#e37c5f',
          500: '#E36C54', // Brand coral — from logo
          600: '#D1573F',
          700: '#b04530',
          800: '#8c3626',
          900: '#69281c',
        },
      },
      // Add custom animations
      animation: {
        blob: 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;