// const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // darkMode: 'class',
  darkMode: ['class'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'],
      mono: ['Roboto Mono', 'monospace'],
    },
    // fontFamily: {
    //   sans: ['Söhne', 'sans-serif'],
    //   mono: ['Söhne Mono', 'monospace'],
    // },
    extend: {
      width: {
        authPageWidth: '500px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'confetti-drift': {
          '0%': {
            transform: 'translateY(0) rotate(0deg)',
            opacity: '1',
          },
          '50%': {
            transform: 'translateY(-10px) rotate(180deg)',
            opacity: '0.8',
          },
          '100%': {
            transform: 'translateY(-20px) rotate(360deg)',
            opacity: '0',
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'confetti-drift': 'confetti-drift 2s ease-out infinite',
      },
      spacing: {
        '18': '4.5rem',  // 72px
        '72': '18rem',   // 288px
        '84': '21rem',   // 336px
        '96': '24rem',   // 384px
      },
      colors: {
        // MELD Primary Color Palette
        'meld-canvas': 'var(--meld-canvas)',
        'meld-ink': 'var(--meld-ink)',
        'meld-sand': 'var(--meld-sand)',
        'meld-sage': 'var(--meld-sage)',
        'meld-ember': 'var(--meld-ember)',
        'meld-graysmoke': 'var(--meld-graysmoke)',
        'meld-maroon': 'var(--meld-maroon)',
        'meld-rose': 'var(--meld-rose)',
        'meld-steel': 'var(--meld-steel)',
        'meld-charcoal': 'var(--meld-charcoal)',
        'meld-rust': 'var(--meld-rust)',
        'meld-frost': 'var(--meld-frost)',
        'meld-cream': 'var(--meld-cream)',
        
        // MELD Fragment Colors
        'meld-fragment-quote': 'var(--meld-fragment-quote)',
        'meld-fragment-quote-dot': 'var(--meld-fragment-quote-dot)',
        'meld-fragment-insight': 'var(--meld-fragment-insight)',
        'meld-fragment-insight-dot': 'var(--meld-fragment-insight-dot)',
        'meld-fragment-question': 'var(--meld-fragment-question)',
        'meld-fragment-question-dot': 'var(--meld-fragment-question-dot)',
        'meld-fragment-todo': 'var(--meld-fragment-todo)',
        'meld-fragment-todo-dot': 'var(--meld-fragment-todo-dot)',
        'meld-fragment-general': 'var(--meld-fragment-general)',
        'meld-fragment-general-dot': 'var(--meld-fragment-general-dot)',
        
        // MELD Wins Vault Colors
        'meld-win-accent': 'var(--meld-win-accent)',
        'meld-win-confetti-1': 'var(--meld-win-confetti-1)',
        'meld-win-confetti-2': 'var(--meld-win-confetti-2)',
        'meld-win-confetti-3': 'var(--meld-win-confetti-3)',
        'meld-win-confetti-4': 'var(--meld-win-confetti-4)',
        
        // MELD North-Star Narrative Colors
        'meld-value-growth': 'var(--meld-value-growth)',
        'meld-value-integrity': 'var(--meld-value-integrity)',
        'meld-value-courage': 'var(--meld-value-courage)',
        'meld-value-innovation': 'var(--meld-value-innovation)',
        'meld-value-empathy': 'var(--meld-value-empathy)',

        // Legacy LibreChat colors (keep for compatibility during transition)
        gray: {
          20: '#ececf1',
          50: '#f7f7f8',
          100: '#ececec',
          200: '#e3e3e3',
          300: '#cdcdcd',
          400: '#999696',
          500: '#595959',
          600: '#424242',
          700: '#2f2f2f',
          800: '#212121',
          850: '#171717',
          900: '#0d0d0d',
        },
        green: {
          50: '#DDECEA',
          100: '#DDECEA',
          200: '#DDECEA',
          300: '#CFCBA0',
          400: '#CFCBA0',
          500: '#CFCBA0',
          550: '#3B3C50',
          600: '#3B3C50',
          700: '#3B3C50',
          800: '#3B3C50',
          900: '#3B3C50',
        },
        theme: {
          maroon: '#692011',
          rose: '#F2DBDB',
          steel: '#3B3C50',
          charcoal: '#2F292B',
          rust: '#BD3C28',
          sage: '#CFCBA0',
          frost: '#DDECEA',
          cream: '#F8F4EB',
        },
        'brand-purple': '#ab68ff',
        'presentation': 'var(--presentation)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-secondary-alt': 'var(--text-secondary-alt)',
        'text-tertiary': 'var(--text-tertiary)',
        'ring-primary': 'var(--ring-primary)',
        'header-primary': 'var(--header-primary)',
        'header-hover': 'var(--header-hover)',
        'header-button-hover': 'var(--header-button-hover)',
        'surface-active': 'var(--surface-active)',
        'surface-active-alt': 'var(--surface-active-alt)',
        'surface-hover': 'var(--surface-hover)',
        'surface-hover-alt': 'var(--surface-hover-alt)',
        'surface-primary': 'var(--surface-primary)',
        'surface-primary-alt': 'var(--surface-primary-alt)',
        'surface-primary-contrast': 'var(--surface-primary-contrast)',
        'surface-secondary': 'var(--surface-secondary)',
        'surface-secondary-alt': 'var(--surface-secondary-alt)',
        'surface-tertiary': 'var(--surface-tertiary)',
        'surface-tertiary-alt': 'var(--surface-tertiary-alt)',
        'surface-dialog': 'var(--surface-dialog)',
        'surface-submit': 'var(--surface-submit)',
        'surface-submit-hover': 'var(--surface-submit-hover)',
        'surface-destructive': 'var(--surface-destructive)',
        'surface-destructive-hover': 'var(--surface-destructive-hover)',
        'surface-chat': 'var(--surface-chat)',
        'border-light': 'var(--border-light)',
        'border-medium': 'var(--border-medium)',
        'border-medium-alt': 'var(--border-medium-alt)',
        'border-heavy': 'var(--border-heavy)',
        'border-xheavy': 'var(--border-xheavy)',
        
        // Shadcn/ui color system (compatible with MELD)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ['switch-unchecked']: 'hsl(var(--switch-unchecked))',
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
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
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
    require('tailwindcss-radix')(),
    // require('@tailwindcss/typography'),
  ],
};
