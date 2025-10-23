/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
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
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Enhanced tag system colors
        tag: {
          provider: {
            bg: 'hsl(219 95% 90%)',
            'bg-dark': 'hsl(219 95% 20%)',
            text: 'hsl(219 95% 20%)',
            'text-dark': 'hsl(219 95% 85%)',
            border: 'hsl(219 95% 60%)',
            'border-dark': 'hsl(219 95% 35%)',
          },
          topic: {
            bg: 'hsl(270 95% 90%)',
            'bg-dark': 'hsl(270 95% 20%)',
            text: 'hsl(270 95% 20%)',
            'text-dark': 'hsl(270 95% 85%)',
            border: 'hsl(270 95% 60%)',
            'border-dark': 'hsl(270 95% 35%)',
          },
          messageType: {
            bg: 'hsl(142 76% 88%)',
            'bg-dark': 'hsl(142 76% 18%)',
            text: 'hsl(142 76% 18%)',
            'text-dark': 'hsl(142 76% 85%)',
            border: 'hsl(142 76% 55%)',
            'border-dark': 'hsl(142 76% 30%)',
          },
          custom: {
            bg: 'hsl(0 0% 90%)',
            'bg-dark': 'hsl(0 0% 20%)',
            text: 'hsl(0 0% 20%)',
            'text-dark': 'hsl(0 0% 85%)',
            border: 'hsl(0 0% 60%)',
            'border-dark': 'hsl(0 0% 35%)',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* Hide scrollbar for Chrome, Safari and Opera */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          /* Hide scrollbar for IE, Edge and Firefox */
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
      })
    },
  ],
}
