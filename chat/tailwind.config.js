/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#1E3A8A',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#7C3AED',
          foreground: '#ffffff',
        },
        pokt: {
          blue: '#1E3A8A',
          purple: '#7C3AED',
          light: '#EEF2FF',
        },
      },
      backgroundImage: {
        'pokt-gradient': 'linear-gradient(135deg, #1E3A8A 0%, #7C3AED 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}







