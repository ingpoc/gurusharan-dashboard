/**
 * Drams-inspired animation configurations for Framer Motion
 * Spring-based animations with stiffness: 170, damping: 30
 */

export const springConfig = {
  stiffness: 170,
  damping: 30,
};

export const springTransition = {
  type: "spring" as const,
  ...springConfig,
};

// Fade in animation
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: springTransition,
};

// Slide up with fade
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: springTransition,
};

// Slide in from left
export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: springTransition,
};

// Slide in from right
export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: springTransition,
};

// Scale up animation
export const scaleUp = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: springTransition,
};

// Stagger children animation helper
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Item for stagger
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// Button hover/tap states
export const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

// Card hover effect
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  hover: {
    scale: 1.01,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: springTransition,
  },
};

// Message bubble animation
export const messageBubble = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springTransition,
      delay: 0.05,
    },
  },
};

// Typing indicator dots
export const typingDot = {
  animate: {
    y: [0, -5, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
