"use client";

import { motion, AnimatePresence } from "framer-motion";
import { modalContent, modalBackdrop } from "@/lib/animations";
import { useEffect, useCallback, HTMLAttributes } from "react";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
}

/**
 * DRAMS Modal Component
 *
 * Dieter Rams Principles:
 * - Understandable: Clear focus, obvious close action
 * - Thorough: Keyboard support, focus trap, ARIA
 * - Unobtrusive: Subtle animations, backdrop blur
 */
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

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    // Save current focused element
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Find all focusable elements
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Focus first element
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }

    // Handle tab key for focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = "";
      // Restore focus when modal closes
      previouslyFocusedElement?.focus();
    };
  }, [isOpen, handleEscape]);

  // Size classes
  const sizeClasses: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            {...modalBackdrop}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1040]"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
            <motion.div
              {...modalContent}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              aria-describedby={description ? "modal-description" : undefined}
              className={`
                relative w-full ${sizeClasses[size]}
                bg-white dark:bg-slate-900
                rounded-xl
                shadow-xl
                max-h-[85vh] overflow-auto
              `}
            >
              {/* Header */}
              {(title || description) && (
                <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-xl font-semibold text-slate-900 dark:text-slate-50 m-0"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 mb-0"
                    >
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Content */}
              <div className="px-6 py-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Modal Footer Component
 */
export function ModalFooter({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        flex justify-end gap-3
        mt-6 pt-4
        border-t border-slate-200 dark:border-slate-700
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
