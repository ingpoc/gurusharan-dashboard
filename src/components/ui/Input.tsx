"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useId, useState } from "react";
import { motion } from "framer-motion";

interface InputBaseProps {
  label?: string;
  error?: string;
  helperText?: string;
  isLoading?: boolean;
}

interface InputProps extends InputBaseProps, InputHTMLAttributes<HTMLInputElement> {}

interface TextareaProps extends InputBaseProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}

// Error icon for error states
const ErrorIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="flex-shrink-0"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// Loading spinner for validation states
const LoadingIcon = () => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="flex-shrink-0"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </motion.svg>
);

/**
 * DRAMS Input Component
 *
 * Dieter Rams Principles:
 * - Understandable: Clear labels, error states
 * - Honest: Loading state for validation
 * - Thorough: Error messages, helper text
 * - Accessible: ARIA attributes, focus states
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, isLoading = false, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = `error-${inputId}`;
    const helperId = `helper-${inputId}`;

    const hasError = !!error;
    const showIcon = hasError || isLoading;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            aria-busy={isLoading}
            className={`
              w-full px-3 py-2.5 text-base
              bg-white dark:bg-slate-900
              border ${hasError
                ? 'border-error pr-10'
                : 'border-slate-300 dark:border-slate-700 pr-3'
              }
              rounded-md
              text-slate-900 dark:text-slate-50
              placeholder:text-slate-400 dark:placeholder:text-slate-600
              focus:outline-none
              focus:ring-2 focus:ring-offset-0
              ${hasError
                ? 'focus:ring-error focus:border-error'
                : 'focus:ring-slate-400 focus:border-slate-400 dark:focus:ring-slate-600 dark:focus:border-slate-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
              ${className}
            `}
            {...props}
          />

          {/* Error or loading icon */}
          {showIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {hasError && <ErrorIcon />}
              {isLoading && !hasError && <LoadingIcon />}
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-error flex items-center gap-1.5"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {!hasError && helperText && (
          <p
            id={helperId}
            className="mt-1.5 text-sm text-slate-600 dark:text-slate-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * DRAMS Textarea Component
 *
 * Same principles as Input, with vertical resize
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, isLoading = false, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || `textarea-${generatedId}`;
    const errorId = `error-${textareaId}`;
    const helperId = `helper-${textareaId}`;

    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            aria-busy={isLoading}
            className={`
              w-full px-3 py-2.5 text-base
              bg-white dark:bg-slate-900
              border ${hasError
                ? 'border-error'
                : 'border-slate-300 dark:border-slate-700'
              }
              rounded-md
              text-slate-900 dark:text-slate-50
              placeholder:text-slate-400 dark:placeholder:text-slate-600
              focus:outline-none
              focus:ring-2 focus:ring-offset-0
              ${hasError
                ? 'focus:ring-error focus:border-error'
                : 'focus:ring-slate-400 focus:border-slate-400 dark:focus:ring-slate-600 dark:focus:border-slate-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              resize-y
              min-h-[100px]
              transition-colors duration-200
              ${className}
            `}
            {...props}
          />
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-error flex items-center gap-1.5"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {!hasError && helperText && (
          <p
            id={helperId}
            className="mt-1.5 text-sm text-slate-600 dark:text-slate-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
