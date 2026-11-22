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
        brand: {
          violet: "#6366F1",
          purple: "#A855F7",
          pink: "#EC4899",
          rose: "#F43F5E",
          cyan: "#06B6D4",
          dark: "#07080E",
          card: "#111422",
          border: "#1E2235",
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px -3px rgba(168, 85, 247, 0.3)' },
          '100%': { boxShadow: '0 0 30px 2px rgba(236, 72, 153, 0.45)' },
        }
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        ymcatinder: {
          "primary": "#A855F7",
          "secondary": "#EC4899",
          "accent": "#6366F1",
          "neutral": "#111422",
          "base-100": "#07080E",
          "base-200": "#0E101A",
          "base-300": "#171A2B",
          "info": "#06B6D4",
          "success": "#10B981",
          "warning": "#F59E0B",
          "error": "#F43F5E",
        },
      },
      "dark",
    ],
  },
}
