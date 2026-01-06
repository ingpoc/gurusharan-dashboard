"use client";

import { MessageList } from "./MessageList";
import type { Message } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/Button";

interface ChatPanelProps {
  messages?: Message[];
  onSendMessage?: (content: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  error?: string | null;
  initialMessages?: Message[];
}

/**
 * DRAMS Chat Panel Component
 *
 * Dieter Rams Principles:
 * - Honest: Clear error display
 * - Understandable: Stop button visible when streaming
 * - Thorough: Handles empty, loading, error states
 */
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <MessageList messages={displayMessages} isLoading={isStreaming} />

      {/* Error display */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="px-4 py-3 bg-error-bg text-error text-sm border-t border-error"
        >
          {error}
        </div>
      )}

      {/* Stop button bar */}
      {isStreaming && onStop && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
          <Button variant="secondary" onClick={onStop} size="sm">
            Stop Generation
          </Button>
        </div>
      )}

      <ChatInput onSendMessage={onSendMessage ?? (() => {})} disabled={isStreaming} />
    </div>
  );
}
