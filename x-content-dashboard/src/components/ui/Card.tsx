"use client";

import { motion } from "framer-motion";
import { cardHover } from "@/lib/animations";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "0",
  sm: "1rem",
  md: "1.5rem",
  lg: "2rem",
};

export function Card({
  hoverable = false,
  padding = "md",
  style,
  children,
  className,
  ...props
}: CardProps) {
  const baseStyle: React.CSSProperties = {
    background: "var(--card-bg)",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    padding: paddingStyles[padding],
    ...style,
  };

  if (hoverable) {
    return (
      <motion.div
        variants={cardHover}
        initial="rest"
        whileHover="hover"
        style={baseStyle}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div style={baseStyle} className={className} {...props}>
      {children}
    </div>
  );
}

// Card subcomponents
export function CardHeader({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        marginBottom: "1rem",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      style={{
        fontSize: "1.125rem",
        fontWeight: 500,
        color: "var(--foreground)",
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      style={{
        fontSize: "0.875rem",
        color: "var(--muted)",
        margin: 0,
        marginTop: "0.25rem",
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={style} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        marginTop: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
