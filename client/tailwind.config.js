import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ymca: {
          crimson: "#FF4458",
          orange: "#FF6B4A",
          dark: "#0F1117",
          card: "#181A20",
          border: "#262933",
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        ymcatinder: {
          "primary": "#FF4458",
          "secondary": "#FF6B4A",
          "accent": "#F5385D",
          "neutral": "#181A20",
          "base-100": "#0F1117",
          "base-200": "#16181F",
          "base-300": "#21242D",
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        },
      },
      "dark",
    ],
  },
}
