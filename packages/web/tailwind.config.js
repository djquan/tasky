/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Follows system preference
  theme: {
    extend: {
      colors: {
        // Custom dark mode colors
        dark: {
          bg: '#1C1C1E',      // Main background
          surface: '#2C2C2E',  // Cards/surfaces
          hover: '#3A3A3C',    // Hover states
          border: '#3A3A3C',   // Borders
        },
        // Custom light mode colors
        light: {
          bg: '#F2F2F7',       // Main background
          surface: '#FFFFFF',  // Cards/surfaces
          hover: '#E5E5EA',    // Hover states
          border: '#D1D1D6',   // Borders
        }
      }
    },
  },
  plugins: [],
}
