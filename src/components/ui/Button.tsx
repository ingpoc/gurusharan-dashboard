"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { buttonVariants } from "@/lib/animations";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * DRAMS Button Component
 *
 * Dieter Rams Principles:
 * - Useful: Clear purpose, visible state
 * - Understandable: Obvious button, proper labels
 * - Honest: Accurate loading state, disabled feedback
 * - Unobtrusive: Subtle hover/tap animations
 */
export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  // Variant classes - pure Tailwind, no inline styles
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-slate-900 text-white border-transparent hover:bg-slate-800 " +
      "dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white",
    secondary:
      "bg-white text-slate-900 border-slate-300 hover:bg-slate-50 hover:border-slate-400 " +
      "dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600",
    ghost:
      "bg-transparent text-slate-700 border-transparent hover:bg-slate-100 " +
      "dark:text-slate-300 dark:hover:bg-slate-800",
    danger:
      "bg-error text-white border-transparent hover:bg-red-700",
    success:
      "bg-green-600 text-white border-transparent hover:bg-green-700 " +
      "dark:bg-green-600 dark:text-white dark:hover:bg-green-700",
  };

  // Size classes
  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // Base classes - focus, disabled, transitions
  const baseClasses =
    "inline-flex items-center justify-center gap-2 " +
    "font-medium rounded-md " +
    "border " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 " +
    "dark:focus-visible:outline-slate-600 " +
    "disabled:opacity-50 disabled:cursor-not-allowed " +
    "transition-colors duration-200 " +
    (fullWidth ? "w-full" : "w-auto");

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileHover={!isDisabled ? "hover" : undefined}
      whileTap={!isDisabled ? "tap" : undefined}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
            aria-hidden="true"
          >
            {/* Loading spinner */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </motion.span>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
