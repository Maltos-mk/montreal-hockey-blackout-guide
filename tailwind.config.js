/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './templates/**/*.html',
    './scripts/**/*.js',
    './shared/**/*.js',
    './data/**/*.json'
  ],
  theme: {
    extend: {
      colors: {
        teamPrimary: 'var(--color-team-primary)',
        teamSecondary: 'var(--color-team-secondary)',
        teamDark: 'var(--color-team-dark)',
      }
    }
  },
  plugins: []
};
