'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { messageBubble } from '@/lib/animations';

export interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
  thinking?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
}

/**
 * DRAMS Streaming Message Component
 *
 * Dieter Rams Principles:
 * - Honest: Clear state indicators (thinking, running, complete)
 * - Understandable: Visual feedback for all states
 * - Unobtrusive: Subtle animations
 */
export function StreamingMessage({
  content,
  isStreaming,
  thinking,
  toolName,
  toolInput,
  toolResult,
}: StreamingMessageProps) {
  return (
    <motion.div {...messageBubble}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-4">
        {/* Thinking indicator */}
        <AnimatePresence>
          {thinking && isStreaming && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400"
              role="status"
              aria-live="polite"
            >
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mr-2"
                aria-hidden="true"
              >
                ●
              </motion.span>
              <span>Thinking...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tool execution indicator */}
        <AnimatePresence>
          {toolName && isStreaming && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-3 bg-info-bg border border-info rounded-lg text-sm text-info"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  aria-hidden="true"
                >
                  ⚙
                </motion.span>
                <span className="font-medium">Running: {toolName}</span>
              </div>
              {toolInput && (
                <div
                  className="mt-2 p-2 bg-white/20 rounded text-xs font-mono overflow-x-auto"
                  role="region"
                  aria-label="Tool parameters"
                >
                  {JSON.stringify(toolInput, null, 2)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tool result */}
        <AnimatePresence>
          {toolResult && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 bg-success-bg border border-success rounded-lg text-sm text-success"
              role="status"
              aria-live="polite"
            >
              ✓ Complete
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message content with streaming indicator */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="ml-1"
              aria-label="Streaming in progress"
            >
              ▍
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
