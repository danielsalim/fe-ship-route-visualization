const plugin = require('tailwindcss/plugin');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
    "./node_modules/tw-elements-react/dist/js/**/*.js",
  ],
  purge: [],
  darkMode: false, // or 'media' or 'class'
  important: true,
  theme: {
    fontFamily: {
      montserrat: ['Montserrat', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      colors: {
        // default v2
        'primary': '#38389A',
        'secondary': '#A09898',
        'tertiary': '#FFF',
        'error': '#DB484A',
        'container': '#1E1E2C',
        'high-container': '#313242',
        'primary-container': '#2A2A4D',
        'low-container': '#8F8FA1',
        'success': '#44C4A1',
        'on-error': '#8C1010',
        'variant-on-surface': '#F0F0F0',
        'outline': '#4E4E4E',
        'base-surface': '#1E1E2C',
        'light-on-primary-container': '#D9D9D9',
        'error-hover': '#F06365',
        'secondary-hover': '#D3C7C7',
        'rac-top-choice': '#262D27',
        'init': '#3F4640',

        // default v1
        'body': '#FFF',
        'main-blue': '#4893E6',
        'main-gray': '#F5F5F5',
        'gray-font': '#696969',
        'tags-container': '#D9D9D9',
        'light-secondary': '#A09898',
        'light-error': '#DB484A',
        'border-outline': "#4E4E4E",
        'light-primary': '#2E6ADF',
        'light-surface-container-low': '#F5F5F5',

        // Dark Mode
        'dark-main-blue': '#374151',
        'dark-main-gray': '#1F2937',
        'dark-gray-font': '#C0C0C0',
        'dark-tags-container': '#1F2937',
        'dark-secondary': '#777777',
        'dark-error': '#DB484A',
        'dark-border-outline': '#666666',
        'dark-primary': '#2468AC',
        'dark-surface-container-low': '#1F2937',

        // Stopwatch
        'stop-button': '#BE1215',

        main: '#4893E6',
        bgMain: '#F5F5F5',
        grayFont: '#696969',
      },
      width: {
        'sidebar': '6%',
        'search': '38.47%',
        'pagination': '85.65%',
        'rows-per-page': '18%',
        'dropdown-category': '18.22%',
        'dropdown-items-per-page': '3%',
        'detail-users': '43.8rem',
        'detail-roles': '75.5rem',
        'edit-users': '75.1rem',
        'add-users': '81.25rem',
        'sea-route': '26.5rem',

        //Stopwatch
        'stopwatch-modal': '15rem',
        'timer-modal': '37rem',
        'timer-text-to-show': '21.3rem',
        'time-unit': '1.4rem',
        'rac': '46.9rem'

      },
      maxWidth: {
        'tags-add': '81.25rem',
      },
      margin: {
        'top-items-per-page': '-10.5rem',
        'items-per-page': '10.15rem',
        'search': '22rem',
      },
      border: {
        '5px': '5px',
      },
      text: {
        header: {
          'font-size': '1.5rem',
          'line-height': '2.5rem',
        }
      },
      boxShadow: {
        '2xl': '0 4px 4px 0 rgba(0, 0, 0, 0.25)',
      },
      height: {
        'input': '23%',
        'check-list': '40%',
        'default-list': '27%',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require("tw-elements-react/dist/plugin.cjs"),
  plugin(function ({ addBase }) {
    addBase({
      '@font-face': {
        fontFamily: 'Montserrat',
        fontWeight: '400',
        src: 'url(/src/static/Montserrat-Regular.ttf)',
      },
    });
  }),
  plugin(function ({ addBase }) {
    addBase({
      '@font-face': {
        fontFamily: 'Montserrat',
        fontWeight: '500',
        src: 'url(/src/static/Montserrat-Medium.ttf)',
      },
    });
  }),
  plugin(function ({ addBase }) {
    addBase({
      '@font-face': {
        fontFamily: 'Montserrat',
        fontWeight: '600',
        src: 'url(/src/static/Montserrat-SemiBold.ttf)',
      },
    });
  }),
  plugin(function ({ addBase }) {
    addBase({
      '@font-face': {
        fontFamily: 'Montserrat',
        fontWeight: '700',
        src: 'url(/src/static/Montserrat-Bold.ttf)',
      },
    });
  }),
  plugin(function ({ addBase }) {
    addBase({
      '@font-face': {
        fontFamily: 'Montserrat',
        fontWeight: '800',
        src: 'url(/src/static/Montserrat-ExtraBold.ttf)',
      },
    });
  }),
  ],
}
