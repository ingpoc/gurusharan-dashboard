"use client";

import { motion } from "framer-motion";
import { messageBubble } from "@/lib/animations";
import { ToolExecutionCard } from "./ToolExecutionCard";

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status?: "running" | "success" | "error";
  result?: unknown;
  error?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

interface MessageBubbleProps {
  message: Message;
}

/**
 * DRAMS Message Bubble Component
 *
 * Dieter Rams Principles:
 * - Honest: Shows timestamp, streaming status
 * - Understandable: Clear distinction between user/assistant
 * - Aesthetic: Asymmetric border radius (Rams style)
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Compute avatar classes
  const avatarClasses = [
    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
    isUser
      ? "bg-slate-900 dark:bg-slate-50"
      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
  ].join(" ");

  // Compute message classes
  const messageClasses = [
    "px-4 py-3.5",
    isUser
      ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-2xl rounded-tr-sm"
      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm"
  ].join(" ");

  return (
    <motion.div
      {...messageBubble}
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-4`}
    >
      <div
        className={`flex items-start gap-3 max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div className={avatarClasses}>
          {isUser ? (
            <span className="text-white dark:text-slate-900 text-xs font-medium">
              U
            </span>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-600 dark:text-slate-400"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          )}
        </div>

        {/* Message content */}
        <div className={messageClasses}>
          <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-1"
                aria-hidden="true"
              >
                ▍
              </motion.span>
            )}
          </p>

          {/* Timestamp - Honest design */}
          <time
            className="block text-xs mt-2 opacity-70"
            dateTime={message.timestamp.toISOString()}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </div>

      {/* Tool execution cards */}
      {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
        <div className="mt-2 ml-11">
          {message.toolCalls.map((toolCall) => (
            <ToolExecutionCard
              key={toolCall.id}
              toolName={toolCall.name}
              parameters={toolCall.input}
              status={toolCall.status || "running"}
              result={toolCall.result}
              error={toolCall.error}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
