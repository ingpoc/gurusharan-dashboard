"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble, Message } from "./MessageBubble";
import { EmptyState } from "@/components/ui/Card";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

/**
 * DRAMS Message List Component
 *
 * Dieter Rams Principles:
 * - Honest: Empty state helpful, shows loading
 * - Thorough: Auto-scroll to bottom
 * - Unobtrusive: Clean layout
 */
export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 dark:text-slate-600">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="Start a conversation"
          description="Ask me to create posts, research topics, or manage your content for @techtrends3107"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </AnimatePresence>

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm max-w-[80%]"
          role="status"
          aria-live="polite"
        >
          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
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
          </div>
          <div className="flex gap-1">
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full"
              aria-hidden="true"
            />
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full"
              aria-hidden="true"
            />
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full"
              aria-hidden="true"
            />
          </div>
        </motion.div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
