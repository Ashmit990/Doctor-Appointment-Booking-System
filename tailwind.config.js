/** @type {import('tailwindcss').Config} */
module.exports = {
  // Updated content paths to match your new professional structure
 content: [
  "./index.html",
  "./src/pages/**/*.html", // Pointing into the src directory
  "./src/js/**/*.js",
  "./src/components/**/*.js"
],
  theme: {
    extend: {
      fontFamily: {
        'lato': ['Lato', 'sans-serif']
      },
      colors: {
        // Your custom medical brand colors
        'medical-teal': '#007E85',
        'medical-green': '#6EAB36',
        'medical-dark': '#333333',
        'brand-primary': '#007E85', // Alias for your main teal
      },
      animation: {
        'underline-grow': 'underlineGrow 0.5s ease-out forwards',
        'bounce-slow': 'bounceSlow 3s infinite ease-in-out',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.7s ease-out forwards',
        'slide-right': 'slideRight 0.8s ease-out forwards',
      },
      clipPath: {
        'blob': 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
      },
      keyframes: {
        underlineGrow: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      }
    },
  },
  plugins: [],
}