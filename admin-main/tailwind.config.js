/** @type {import('tailwindcss').Config} */
module.exports = {
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
          50: '#f4f2f9',
          100: '#e9e4f2',
          200: '#d3c9e6',
          300: '#b3a3d3',
          400: '#8f7bb8',
          500: '#6B5B9A', // Brand purple
          600: '#5B4B8A', // Brand purple, darker
          700: '#4a3d71',
          800: '#3a3059',
          900: '#2b2442',
        },
        secondary: {
          50: '#fdf2f6',
          100: '#fbe0e9',
          200: '#f6c0d3',
          300: '#ec93b2',
          400: '#dd6a94',
          500: '#C9507B', // Brand rose
          600: '#B4406C', // Brand rose, darker
          700: '#94355a',
          800: '#742a47',
          900: '#551f34',
        },
        accent: {
          50: '#fef4f2',
          100: '#fde4df',
          200: '#fac7bd',
          300: '#f6a094',
          400: '#f2907e',
          500: '#F08070', // Brand coral
          600: '#E87461', // Brand coral, darker
          700: '#c25f4d',
          800: '#9c4b3d',
          900: '#76392e',
        },
      },
    },
  },
  plugins: [],
}
