/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:          '#0C66E4',
        'primary-hover':  '#0055CC',
        'primary-active': '#09326C',
        navy:             '#091E42',
        'navy-2':         '#172B4D',
        'navy-3':         '#44546F',
        blue: {
          light: '#E9F2FF',
          mid:   '#85B8FF',
        },
        gray: {
          bg:     '#F1F2F4',
          border: '#DCDFE4',
          medium: '#A9ABAF',
          dark:   '#505258',
        },
        warning: '#F5CD47',
      },
      boxShadow: {
        card:        'rgba(9, 30, 66, 0.13) 0px 1px 1px 0px',
        'card-hover':'rgba(9, 30, 66, 0.25) 0px 4px 8px 0px',
        btn:         'rgba(9, 30, 66, 0.15) 0px 8px 16px 0px',
      },
      borderRadius: {
        btn: '4.8px',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
