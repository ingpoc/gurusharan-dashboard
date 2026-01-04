"use client";

import { motion } from "framer-motion";
import { messageBubble } from "@/lib/animations";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      {...messageBubble}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          display: "flex",
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-start",
          gap: "0.75rem",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: isUser ? "var(--accent)" : "var(--card-bg)",
            border: isUser ? "none" : "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isUser ? (
            <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 500 }}>
              U
            </span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          )}
        </div>

        {/* Message content */}
        <div
          style={{
            background: isUser ? "var(--accent)" : "var(--card-bg)",
            color: isUser ? "white" : "var(--foreground)",
            padding: "0.875rem 1rem",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            border: isUser ? "none" : "1px solid var(--border)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {message.content}
            {message.isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ marginLeft: "2px" }}
              >
                ▍
              </motion.span>
            )}
          </p>
          <span
            style={{
              display: "block",
              fontSize: "0.6875rem",
              marginTop: "0.5rem",
              opacity: 0.7,
            }}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
