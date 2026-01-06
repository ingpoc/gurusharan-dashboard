"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_LENGTH = 2000;

/**
 * DRAMS Chat Input Component
 *
 * Dieter Rams Principles:
 * - Understandable: Clear helper text, character count
 * - Honest: Submit button state reflects content
 * - Thorough: Keyboard shortcuts, auto-resize
 */
export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 120;
    textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSendMessage(trimmed);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = !message.trim();
  const isNearLimit = message.length > MAX_LENGTH * 0.9;
  const characterCount = message.length;

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            maxLength={MAX_LENGTH}
            className={`
              w-full px-4 py-3 text-sm
              bg-white dark:bg-slate-900
              border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-offset-0
              resize-none
              transition-colors duration-200
              ${
                isNearLimit
                  ? "border-error focus:ring-error pr-16"
                  : "border-slate-300 dark:border-slate-700 focus:ring-slate-400 dark:focus:ring-slate-600"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            aria-label="Message input"
            aria-describedby="chat-input-helper"
          />

          {/* Character count - show when near limit */}
          {isNearLimit && (
            <div
              className={`
                absolute bottom-3 right-3 text-xs font-medium
                ${characterCount >= MAX_LENGTH ? "text-error" : "text-warning"}
              `}
              aria-live="polite"
            >
              {characterCount}/{MAX_LENGTH}
            </div>
          )}
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSend}
          disabled={disabled || isEmpty}
          size="md"
          className="h-11 min-w-11 px-4"
          aria-label="Send message"
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
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </Button>
      </div>

      {/* Helper text */}
      <p
        id="chat-input-helper"
        className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-0 text-center"
      >
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
