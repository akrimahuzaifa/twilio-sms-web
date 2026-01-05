/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'primary-hover': '#2563eb',
        'bg-page': '#f8fafc',
        'card-bg': '#ffffff',
        'text-main': '#1e293b',
        'text-muted': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto'],
      },
    },
  },
  plugins: [],
}
