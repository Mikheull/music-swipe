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
      }
    },
  },
  plugins: [
    require("flowbite/plugin")
  ],
}