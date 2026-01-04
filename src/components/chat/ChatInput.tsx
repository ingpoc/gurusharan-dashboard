"use client";

import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");

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

  return (
    <div
      style={{
        padding: "1rem 1.5rem",
        borderTop: "1px solid var(--border)",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            fontSize: "0.9375rem",
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)",
            outline: "none",
            resize: "none",
            minHeight: "44px",
            maxHeight: "120px",
            fontFamily: "inherit",
          }}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="md"
          style={{
            height: "44px",
            minWidth: "44px",
            padding: "0 1rem",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </Button>
      </div>

      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--muted)",
          marginTop: "0.5rem",
          marginBottom: 0,
          textAlign: "center",
        }}
      >
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
