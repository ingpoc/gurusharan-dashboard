/**
 * DRAMS Design System - Framer Motion Animations
 *
 * Dieter Rams Principles:
 * - Subtle, purposeful motion
 * - Doesn't distract from content
 * - Smooth, spring-based transitions
 * - Respects user motion preferences
 */

// ============================================
// Reduced Motion Check
// ============================================
export const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

// ============================================
// Spring Config
// ============================================
export const springConfig = {
  stiffness: 150,
  damping: 20,
};

export const springTransition = {
  type: "spring" as const,
  ...springConfig,
};

// ============================================
// Preset Animations
// ============================================

// Fade in
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: springTransition,
};

// Slide up with fade
export const slideUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
  transition: springTransition,
};

// Slide in from left
export const slideInLeft = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -5 },
  transition: springTransition,
};

// Slide in from right
export const slideInRight = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 5 },
  transition: springTransition,
};

// Scale in (subtle)
export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: springTransition,
};

// ============================================
// Stagger Helpers
// ============================================
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
};

// ============================================
// Component-Specific Animations
// ============================================

// Button - subtle hover/tap
export const buttonVariants = {
  initial: { scale: 1 },
  hover: prefersReducedMotion ? {} : { scale: 1.02 },
  tap: prefersReducedMotion ? {} : { scale: 0.98 },
};

// Card - minimal lift
export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.005,
    y: -2,
    transition: springTransition,
  },
};

// Message bubble
export const messageBubble = {
  initial: { opacity: 0, y: 5, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springTransition,
      delay: 0.03,
    },
  },
};

// Typing indicator dots
export const typingDot = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Toast notification slide in
export const toastSlide = {
  initial: { opacity: 0, x: 100, y: 0 },
  animate: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 50, y: 0 },
  transition: springTransition,
};

// Modal backdrop
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

// Modal content
export const modalContent = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: springTransition,
};
