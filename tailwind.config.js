/**
 * DRAMS Design System - Tailwind Config
 *
 * Dieter Rams Principles:
 * - Minimal, timeless aesthetic
 * - Clear, understandable interactions
 * - Thorough state handling
 * - Full accessibility compliance
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============================================
      // Colors - Slate Palette (Pure Neutrals)
      // ============================================
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Semantic state colors
        success: {
          DEFAULT: '#16a34a',
          bg: '#dcfce7',
        },
        warning: {
          DEFAULT: '#ca8a04',
          bg: '#fef9c3',
        },
        error: {
          DEFAULT: '#dc2626',
          bg: '#fee2e2',
        },
        info: {
          DEFAULT: '#2563eb',
          bg: '#dbeafe',
        },
      },

      // ============================================
      // Spacing - Consistent Scale
      // ============================================
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },

      // ============================================
      // Border Radius - Consistent Rounding
      // ============================================
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },

      // ============================================
      // Shadows - Depth Hierarchy
      // ============================================
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'focus-ring': '0 0 0 2px white, 0 0 0 4px #94a3b8',
        'focus-ring-dark': '0 0 0 2px #0f172a, 0 0 0 4px #475569',
      },

      // ============================================
      // Transition - Smooth, Purposeful
      // ============================================
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        drams: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ============================================
      // Animation - Subtle Microinteractions
      // ============================================
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fade-in-up 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-down': 'fade-in-down 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slide-in-left 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slide-in-right 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
      },

      // ============================================
      // Typography - System Fonts
      // ============================================
      fontFamily: {
        sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },

      // ============================================
      // Z-Index - Layer Hierarchy
      // ============================================
      zIndex: {
        dropdown: 1000,
        sticky: 1020,
        fixed: 1030,
        modalBackdrop: 1040,
        modal: 1050,
        popover: 1060,
        tooltip: 1070,
      },
    },
  },
  plugins: [],
};
