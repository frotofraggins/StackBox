/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium StackPro Color System
        primary: '#6366F1',        // Electric Indigo - Bold and modern
        'primary-hover': '#4F46E5', // Darker indigo for hover states
        accent: '#22D3EE',         // Aqua Sky - Fresh, energetic contrast
        background: '#0F172A',     // Charcoal Slate - Deep navy background
        surface: '#1E293B',       // Slate Gray - Card surfaces, modals
        'text-light': '#F1F5F9',  // White Smoke - Main text on dark
        'text-dark': '#0F172A',   // Slate 900 - Text on light backgrounds
        'text-secondary': '#94A3B8', // Slate 400 - Secondary text
        'text-muted': '#64748B',  // Slate 500 - Muted/disabled text
        border: '#334155',        // Slate 700 - Divider lines
        
        // Extended Accent Palette
        success: '#10B981',       // Emerald Green - Success states
        warning: '#F59E0B',       // Amber Gold - Warnings, upgrades
        error: '#EF4444',         // Rose Red - Errors, urgent notices
        info: '#38BDF8',          // Sky Blue - Secondary CTAs
        
        // Semantic aliases for better usage
        'surface-light': '#334155', // Lighter surface variant
        'surface-dark': '#0F172A',  // Darker surface variant
        glass: 'rgba(99, 102, 241, 0.1)', // Primary glass effect
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
