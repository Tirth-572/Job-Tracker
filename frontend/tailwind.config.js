const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f2f2',
          100: '#b3e0e0',
          200: '#80cdcd',
          300: '#4db9b9',
          400: '#24b1b1', // Vibrant Teal
          500: '#1c8d8d',
          600: '#007979', // Deep Teal
          700: '#006060',
          800: '#004848',
          900: '#003030',
        },
        accent: {
          50: '#fffcf9',
          100: '#fff0e4', // Soft Peach
          200: '#ffe0c5', // Warm Apricot
          300: '#ffca9e',
          400: '#ffad6b',
          500: '#ff8a38',
        },
        gray: colors.slate,
        secondary: {
          DEFAULT: '#24b1b1',
          500: '#24b1b1',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 10px 40px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 20px 50px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideDown: { '0%': { transform: 'translateY(-10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
