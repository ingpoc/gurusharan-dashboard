/**
 * DRAMS Design System - Tailwind Config Extension
 *
 * Dieter Rams Principles:
 * - Minimal, timeless aesthetic
 * - Clear, understandable interactions
 * - Thorough state handling
 * - Full accessibility compliance
 *
 * @see https://tailwindcss.com/docs/customizing-theme
 */

import type { Config } from 'tailwindcss';

const dramsConfig: Config = {
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
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        error: {
          DEFAULT: 'var(--error)',
          bg: 'var(--error-bg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          bg: 'var(--info-bg)',
        },
      },

      // ============================================
      // Spacing - Consistent Scale
      // ============================================
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },

      // ============================================
      // Border Radius - Consistent Rounding
      // ============================================
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },

      // ============================================
      // Shadows - Depth Hierarchy
      // ============================================
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        // Focus ring for accessibility
        'focus-ring': '0 0 0 2px var(--background), 0 0 0 4px var(--slate-400)',
        'focus-ring-dark': '0 0 0 2px var(--background), 0 0 0 4px var(--slate-600)',
      },

      // ============================================
      // Transition - Smooth, Purposeful
      // ============================================
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        drams: 'var(--easing)',
      },

      // ============================================
      // Animation - Subtle Microinteractions
      // ============================================
      keyframes: {
        // Fade in
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Fade in from up
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Fade in from down
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Scale in
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Slide in from left
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Slide in from right
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Pulse for loading/attention
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        // Spinner for loading
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-base) var(--easing)',
        'fade-in-up': 'fade-in-up var(--duration-base) var(--easing)',
        'fade-in-down': 'fade-in-down var(--duration-base) var(--easing)',
        'scale-in': 'scale-in var(--duration-base) var(--easing)',
        'slide-in-left': 'slide-in-left var(--duration-base) var(--easing)',
        'slide-in-right': 'slide-in-right var(--duration-base) var(--easing)',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
      },

      // ============================================
      // Typography - System Fonts
      // ============================================
      fontFamily: {
        sans: 'var(--font-sans)',
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

  // ============================================
  // Plugins
  // ============================================
  plugins: [],
};

export default dramsConfig;
