"use client";

import { motion, AnimatePresence } from "framer-motion";
import { scaleUp } from "@/lib/animations";
import { useEffect, useCallback, HTMLAttributes } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: { maxWidth: "400px" },
  md: { maxWidth: "500px" },
  lg: { maxWidth: "640px" },
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 100,
            }}
          />

          {/* Modal */}
          <motion.div
            {...scaleUp}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              ...sizeStyles[size],
              width: "calc(100% - 2rem)",
              background: "var(--background)",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              zIndex: 101,
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            {/* Header */}
            {(title || description) && (
              <div
                style={{
                  padding: "1.5rem 1.5rem 0",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "1rem",
                }}
              >
                {title && (
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      margin: 0,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--muted)",
                      margin: 0,
                      marginTop: "0.25rem",
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                padding: "0.5rem",
                cursor: "pointer",
                color: "var(--muted)",
                borderRadius: "6px",
              }}
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Content */}
            <div style={{ padding: "1.5rem" }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Modal footer component
export function ModalFooter({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "0.75rem",
        marginTop: "1.5rem",
        paddingTop: "1rem",
        borderTop: "1px solid var(--border)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
