"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, style, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;

    return (
      <div style={{ width: "100%" }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--foreground)",
              marginBottom: "0.5rem",
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            width: "100%",
            padding: "0.625rem 0.75rem",
            fontSize: "0.9375rem",
            background: "var(--background)",
            border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
            borderRadius: "6px",
            color: "var(--foreground)",
            outline: "none",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            ...style,
          }}
          {...props}
        />
        {(error || helperText) && (
          <p
            style={{
              fontSize: "0.75rem",
              marginTop: "0.375rem",
              marginBottom: 0,
              color: error ? "#ef4444" : "var(--muted)",
            }}
          >
            {error || helperText}
          </p>
        )}
        <style jsx>{`
          input:focus {
            border-color: var(--accent) !important;
            box-shadow: 0 0 0 3px rgba(255, 97, 26, 0.1) !important;
          }
          input::placeholder {
            color: var(--muted);
          }
        `}</style>
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea variant
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, style, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || `textarea-${generatedId}`;

    return (
      <div style={{ width: "100%" }}>
        {label && (
          <label
            htmlFor={textareaId}
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--foreground)",
              marginBottom: "0.5rem",
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          style={{
            width: "100%",
            padding: "0.625rem 0.75rem",
            fontSize: "0.9375rem",
            background: "var(--background)",
            border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
            borderRadius: "6px",
            color: "var(--foreground)",
            outline: "none",
            resize: "vertical",
            minHeight: "100px",
            fontFamily: "inherit",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            ...style,
          }}
          {...props}
        />
        {(error || helperText) && (
          <p
            style={{
              fontSize: "0.75rem",
              marginTop: "0.375rem",
              marginBottom: 0,
              color: error ? "#ef4444" : "var(--muted)",
            }}
          >
            {error || helperText}
          </p>
        )}
        <style jsx>{`
          textarea:focus {
            border-color: var(--accent) !important;
            box-shadow: 0 0 0 3px rgba(255, 97, 26, 0.1) !important;
          }
          textarea::placeholder {
            color: var(--muted);
          }
        `}</style>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
