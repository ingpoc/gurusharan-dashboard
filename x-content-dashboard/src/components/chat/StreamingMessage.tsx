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
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* Thinking indicator */}
        <AnimatePresence>
          {thinking && isStreaming && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--muted)',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
              }}
            >
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ marginRight: '0.5rem' }}
              >
                ●
              </motion.span>
              Thinking...
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
              style={{
                marginBottom: '0.75rem',
                padding: '0.75rem',
                background: 'var(--accent)',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⚙
                </motion.span>
                <span style={{ fontWeight: 500 }}>
                  Running: {toolName}
                </span>
              </div>
              {toolInput && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                  }}
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
              style={{
                marginBottom: '0.75rem',
                padding: '0.75rem',
                background: 'var(--success)',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: 'white',
              }}
            >
              ✓ Complete
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message content */}
        <div
          style={{
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {content}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ marginLeft: '2px' }}
            >
              ▍
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
