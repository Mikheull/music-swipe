/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './node_modules/flowbite-react/**/*.js',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {  DEFAULT: '#C996EE',  50: '#FFFFFF',  100: '#FFFFFF',  200: '#FFFFFF',  300: '#EDDCF9',  400: '#DBB9F4',  500: '#C996EE',  600: '#B066E6',  700: '#9735DE',  800: '#7A1FBD',  900: '#5B178D',  950: '#4C1375'},
        spotify: {  DEFAULT: '#1DBA54',  50: '#9FF0BB',  100: '#8DEDAF',  200: '#6AE896',  300: '#46E27D',  400: '#23DD64',  500: '#1DBA54',  600: '#15893E',  700: '#0E5928',  800: '#062812',  900: '#000000',  950: '#000000'},
      },
      fontFamily: {
        'powergrotesk': ['PowerGrotesk', 'sans-serif']
      },
    },
  },
  plugins: [
    require("flowbite/plugin")
  ],
}