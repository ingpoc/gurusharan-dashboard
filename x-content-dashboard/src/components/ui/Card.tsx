"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { HTMLAttributes } from "react";

type CardPadding = "none" | "sm" | "md" | "lg";
type CardVariant = "default" | "empty" | "loading";

// Common props excluding conflicting animation handlers
type BaseCardProps = {
  hoverable?: boolean;
  padding?: CardPadding;
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
};

type CardProps = BaseCardProps & Omit<HTMLAttributes<HTMLDivElement>, keyof BaseCardProps>;

/**
 * DRAMS Card Component
 *
 * Dieter Rams Principles:
 * - Aesthetic: Minimal, clean design
 * - Unobtrusive: Subtle hover effects
 * - Thorough: Empty and loading states
 */
export function Card({
  hoverable = false,
  padding = "md",
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  // Padding classes
  const paddingClasses: Record<CardPadding, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  // Base classes - card styling
  const baseClasses =
    "bg-white dark:bg-slate-900 " +
    "border border-slate-200 dark:border-slate-700 " +
    "rounded-lg " +
    "shadow-sm";

  // Hover classes - subtle lift
  const hoverClasses =
    "hover:border-slate-300 dark:hover:border-slate-600 " +
    "hover:shadow-md " +
    "transition-all duration-200";

  // Empty state classes
  const emptyClasses =
    variant === "empty"
      ? "flex flex-col items-center justify-center text-center min-h-[200px]"
      : "";

  // Loading state classes
  const loadingClasses = variant === "loading" ? "animate-pulse" : "";

  const cardClassName = `${baseClasses} ${paddingClasses[padding]} ${
    hoverable ? hoverClasses : ""
  } ${emptyClasses} ${loadingClasses} ${className}`;

  if (hoverable) {
    return (
      <motion.div
        initial={{ scale: 1, y: 0 }}
        whileHover={{ scale: 1.005, y: -2 }}
        transition={{ duration: 0.2 }}
        className={cardClassName}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cardClassName} {...props}>
      {children}
    </div>
  );
}

// ============================================
// Card Subcomponents
// ============================================

export function CardHeader({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-medium text-slate-900 dark:text-slate-50 m-0 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm text-slate-600 dark:text-slate-400 mt-1 mb-0 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-4 flex items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// Card States
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Empty State Component
 *
 * Dieter Rams Principles:
 * - Useful: Clear next steps
 * - Understandable: Helpful messaging
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card variant="empty" padding="lg">
      {icon && (
        <div className="text-slate-400 dark:text-slate-600 mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-base font-medium text-slate-900 dark:text-slate-50 mb-2">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

/**
 * Loading Skeleton Component
 *
 * Dieter Rams Principles:
 * - Honest: Shows content is loading
 * - Unobtrusive: Subtle animation
 */
export function CardSkeleton({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <Card variant="loading" padding="md" className={className}>
      {/* Title skeleton */}
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />

      {/* Line skeletons */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2 last:mb-0 ${
            i === lines - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </Card>
  );
}
