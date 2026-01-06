'use client';

import { MainLayout } from '@/components/layout';
import { MessageBubble, type Message } from '@/components/chat';
import { ChatPanel } from '@/components/chat';
import { useChat, type StreamingMessage, type ToolCall } from '@/hooks/useChat';
import { useState } from 'react';

export default function ChatPage() {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const { messages, isStreaming, error, sendMessage, stopGeneration } = useChat({
    onToolUse: (toolName, input) => {
      setToolCalls((prev) => [...prev, { name: toolName, input }]);
    },
    onError: (err) => console.error('Chat error:', err),
  });

  // Convert StreamingMessage to Message type for MessageBubble
  const formatMessages = (): Message[] => {
    return messages.map((msg: StreamingMessage) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      isStreaming: msg.isStreaming,
    }));
  };

  return (
    <MainLayout title="Chat">
      <div className="h-[calc(100vh-64px-3rem)] max-w-[900px] mx-auto">
        <ChatPanel
          messages={formatMessages()}
          onSendMessage={sendMessage}
          onStop={stopGeneration}
          isStreaming={isStreaming}
          error={error}
        />
      </div>
    </MainLayout>
  );
}
