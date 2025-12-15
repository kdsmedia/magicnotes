/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",        // Match files in root (App.tsx, index.tsx)
    "./components/**/*.{js,ts,jsx,tsx}", // Match files in components folder
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1', // Indigo 500
        secondary: '#1e293b', // Slate 800
        accent: '#818cf8', // Indigo 400
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'float-3d': 'float-3d 6s ease-in-out infinite',
        'progress-fill': 'progress-fill 10s linear forwards',
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-out': 'fadeOut 0.5s ease-in forwards',
      },
      keyframes: {
        'float-3d': {
          '0%, 100%': { transform: 'translateY(0) rotateX(0) rotateY(0)', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.2))' },
          '50%': { transform: 'translateY(-20px) rotateX(5deg) rotateY(-5deg)', filter: 'drop-shadow(0 40px 40px rgba(99, 102, 241, 0.4))' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0', pointerEvents: 'none' },
        }
      }
    },
  },
  plugins: [],
}