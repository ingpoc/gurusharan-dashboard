'use client';

import { MainLayout } from '@/components/layout';
import { MessageBubble, type Message, ChatSessionsList } from '@/components/chat';
import { ChatPanel } from '@/components/chat';
import { useChat, type StreamingMessage, type ToolCall } from '@/hooks/useChat';
import { useState, useEffect, useRef } from 'react';

export default function ChatPage() {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionsRefreshKey, setSessionsRefreshKey] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedCountRef = useRef(0);
  const { messages, isStreaming, error, sendMessage, stopGeneration, setMessages, clearMessages } = useChat({
    onToolUse: (toolName, input) => {
      setToolCalls((prev) => [...prev, { name: toolName, input }]);
    },
    onError: (err) => console.error('Chat error:', err),
  });

  // Load session when selected
  useEffect(() => {
    if (!currentSessionId) return;

    const loadSession = async () => {
      setIsLoadingSession(true);
      try {
        const res = await fetch(`/api/chat/sessions/${currentSessionId}`);
        if (res.ok) {
          const session = await res.json();
          const parsedMessages = JSON.parse(session.messages || '[]');
          // Convert stored messages to StreamingMessage format
          const streamingMessages: StreamingMessage[] = parsedMessages.map((msg: any) => ({
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp).getTime(),
            isStreaming: false,
          }));
          setMessages(streamingMessages);
          lastSavedCountRef.current = streamingMessages.length;
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };
    loadSession();
  }, [currentSessionId, setMessages]);

  // Auto-save messages with debounce (only when NEW messages are added)
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;

    // Don't save while streaming - wait for response to complete
    if (isStreaming) return;

    // Only save if message count increased since last save
    if (messages.length <= lastSavedCountRef.current) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Capture current count to save
    const countToSave = messages.length;

    // Save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/chat/sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp).toISOString(),
            })),
          }),
        });
        lastSavedCountRef.current = countToSave;
        setSessionsRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentSessionId, messages, isStreaming]);

  // Create new session on first message if none exists
  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) {
      try {
        const res = await fetch('/api/chat/sessions', { method: 'POST' });
        if (res.ok) {
          const newSession = await res.json();
          lastSavedCountRef.current = 0; // Reset for new session
          setCurrentSessionId(newSession.id);
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }
    sendMessage(content);
  };

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
      <div className="h-[calc(100vh-64px-3rem)] flex gap-4">
        {/* Sessions Sidebar */}
        <ChatSessionsList
          currentSessionId={currentSessionId}
          triggerRefresh={sessionsRefreshKey}
          onSessionSelect={(id) => {
            lastSavedCountRef.current = 0; // Reset before loading new session
            setCurrentSessionId(id);
            clearMessages();
          }}
        />

        {/* Chat Panel */}
        <div className="flex-1 max-w-full">
          {isLoadingSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-500">Loading chat...</div>
            </div>
          ) : (
            <ChatPanel
              messages={formatMessages()}
              onSendMessage={handleSendMessage}
              onStop={stopGeneration}
              isStreaming={isStreaming}
              error={error}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
