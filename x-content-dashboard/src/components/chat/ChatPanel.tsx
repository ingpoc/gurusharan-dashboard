'use client';

import { MessageList } from './MessageList';
import type { Message } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/Button';

interface ChatPanelProps {
  messages?: Message[];
  onSendMessage?: (content: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  error?: string | null;
  initialMessages?: Message[];
}

export function ChatPanel({
  messages = [],
  onSendMessage,
  onStop,
  isStreaming = false,
  error = null,
  initialMessages,
}: ChatPanelProps) {
  // If initialMessages is provided, use it as default for messages
  const displayMessages = messages.length > 0 ? messages : (initialMessages || []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--background)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <MessageList messages={displayMessages} isLoading={isStreaming} />

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--error, #dc2626)',
            color: 'white',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Stop button bar */}
      {isStreaming && onStop && (
        <div
          style={{
            padding: '0.5rem 1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--muted)',
          }}
        >
          <Button variant="secondary" onClick={onStop} size="sm">
            Stop Generation
          </Button>
        </div>
      )}

      <ChatInput onSendMessage={onSendMessage ?? (() => {})} disabled={isStreaming} />
    </div>
  );
}
