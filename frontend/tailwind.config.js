module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#71C9CE',
          secondary: '#A6E3E9',
          background: '#CBF1F5',
          surface: '#E3FDFD',
        },
        primary: {
          DEFAULT: '#71C9CE',
          hover: '#A6E3E9',
        },
        secondary: {
          DEFAULT: '#A6E3E9',
          hover: '#71C9CE',
        },
        background: '#CBF1F5',
        surface: '#E3FDFD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 30px rgba(113, 201, 206, 0.15)',
        brand: '0 4px 14px rgba(113,201,206,0.35)',
        'brand-lg': '0 8px 24px rgba(113,201,206,0.4)',
        inner: 'inset 0 1px 3px rgba(0,0,0,0.06)',
        soft: '0 2px 10px rgba(113, 201, 206, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        shimmer: { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
};
