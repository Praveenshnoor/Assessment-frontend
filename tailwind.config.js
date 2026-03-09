/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        shnoor: {
          // The Dark Theme (Headers, Text)
          navy: '#0E0E27',       // Deepest background & primary text
          navyLight: '#272757',  // Lighter navy (used in the login page)

          // The Primary Brand (Buttons, Active States)
          indigo: '#44448E',     // Primary call-to-action color
          indigoMedium: '#6868AC', // Secondary icons / empty states

          // The Soft/Disabled Theme (Secondary Buttons, Borders)
          soft: '#8F8FC4',       // Disabled text / soft accents
          light: '#B7B7D9',      // Subtle highlights
          mist: '#D1D1E6',       // Input borders & subtle dividers

          // The Canvas (Backgrounds)
          lavender: '#E0E0EF',   // The main page background

          // Add Semantic Colors (Tinted to match the indigo/navy aesthetic)
          success: '#34d399',      // A modern, soft green
          successLight: '#d1fae5', // Light green for backgrounds
          danger: '#f87171',       // A soft, clean red
          dangerLight: '#fee2e2',  // Light red for backgrounds
          warning: '#fbbf24',      // Soft amber/yellow
          warningLight: '#fef3c7', // Light yellow for backgrounds
        }
      }
    },
  },
  plugins: [],
}