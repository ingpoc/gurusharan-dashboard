"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { buttonVariants } from "@/lib/animations";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--accent)",
    color: "white",
    border: "none",
  },
  secondary: {
    background: "var(--card-bg)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--foreground)",
    border: "none",
  },
  danger: {
    background: "#ef4444",
    color: "white",
    border: "none",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
  },
  md: {
    padding: "0.625rem 1rem",
    fontSize: "0.9375rem",
  },
  lg: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
  },
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled && !isLoading ? "hover" : undefined}
      whileTap={!disabled && !isLoading ? "tap" : undefined}
      disabled={disabled || isLoading}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: "6px",
        fontWeight: 500,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        width: fullWidth ? "100%" : "auto",
        transition: "opacity 0.2s ease",
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ display: "inline-block" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </motion.span>
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
