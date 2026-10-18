/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--color-brand-50, #f0f9ff)',
          100: 'var(--color-brand-100, #e0f2fe)',
          200: 'var(--color-brand-200, #bae6fd)',
          300: 'var(--color-brand-300, #7dd3fc)',
          400: 'var(--color-brand-400, #38bdf8)',
          500: 'var(--color-brand-500, #0284c7)', // Primary dynamic company color
          600: 'var(--color-brand-600, #0369a1)',
          700: 'var(--color-brand-700, #075985)',
          800: 'var(--color-brand-800, #0c4a6e)',
          900: 'var(--color-brand-900, #082f49)',
          950: 'var(--color-brand-950, #041c2c)',
          DEFAULT: 'var(--color-brand-primary, #0284c7)',
          accent: 'var(--color-brand-accent, #f59e0b)',
        },
        construction: {
          amber: '#f59e0b',
          safety: '#ea580c',
          concrete: '#64748b',
          rebar: '#dc2626',
          approved: '#16a34a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
