'use client';

import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result?: string;
}

export interface StreamingMessage extends ChatMessage {
  isStreaming: boolean;
  thinking?: string;
}

interface ChatState {
  messages: StreamingMessage[];
  isStreaming: boolean;
  error: string | null;
}

interface UseChatOptions {
  onError?: (error: string) => void;
  onComplete?: (message: StreamingMessage) => void;
  onToolUse?: (toolName: string, input: Record<string, unknown>) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isStreaming: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageRef = useRef<string>('');
  const currentToolCallsRef = useRef<ToolCall[]>([]);

  const addMessage = useCallback((message: Omit<StreamingMessage, 'id' | 'timestamp'>) => {
    const newMessage: StreamingMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));

    return newMessage;
  }, []);

  const updateLastMessage = useCallback(
    (updates: Partial<StreamingMessage>) => {
      setState((prev) => {
        const messages = [...prev.messages];
        const lastIndex = messages.length - 1;
        if (lastIndex >= 0) {
          messages[lastIndex] = { ...messages[lastIndex], ...updates };
        }
        return { ...prev, messages };
      });
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isStreaming) return;

      setState((prev) => ({ ...prev, error: null }));

      // Add user message
      addMessage({
        role: 'user',
        content: content.trim(),
        isStreaming: false,
      });

      // Create new abort controller
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      currentMessageRef.current = '';
      currentToolCallsRef.current = [];

      // Add placeholder for assistant response
      addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
        toolCalls: [],
      });

      setState((prev) => ({ ...prev, isStreaming: true }));

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;

            const data = line.slice(6);
            if (data.trim() === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              if (event.type === 'text') {
                currentMessageRef.current += event.content;
                updateLastMessage({
                  content: currentMessageRef.current,
                  isStreaming: true,
                });
              } else if (event.type === 'tool_use') {
                const toolCall: ToolCall = {
                  name: event.toolName || 'unknown',
                  input: event.toolInput || {},
                };
                currentToolCallsRef.current.push(toolCall);
                updateLastMessage({
                  toolCalls: [...currentToolCallsRef.current],
                  isStreaming: true,
                });
                options.onToolUse?.(toolCall.name, toolCall.input);
              } else if (event.type === 'tool_result') {
                // Update the last tool call with result
                const calls = [...currentToolCallsRef.current];
                if (calls.length > 0) {
                  calls[calls.length - 1].result = event.content;
                  updateLastMessage({
                    toolCalls: calls,
                    isStreaming: true,
                  });
                }
              } else if (event.type === 'done') {
                updateLastMessage({
                  isStreaming: false,
                });
                setState((prev) => ({ ...prev, isStreaming: false }));

                setState((prev) => {
                  const lastMessage = prev.messages[prev.messages.length - 1];
                  options.onComplete?.(lastMessage);
                  return prev;
                });
              } else if (event.type === 'error') {
                throw new Error(event.content);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMessage,
        }));

        setState((prev) => ({
          ...prev,
          messages: prev.messages.slice(0, -1),
        }));

        options.onError?.(errorMessage);
      }
    },
    [state.messages, state.isStreaming, addMessage, updateLastMessage, options]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false }));
    updateLastMessage({ isStreaming: false });
  }, [updateLastMessage]);

  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      isStreaming: false,
      error: null,
    });
  }, []);

  const setMessages = useCallback((messages: StreamingMessage[]) => {
    setState((prev) => ({
      ...prev,
      messages,
    }));
  }, []);

  const retryLastMessage = useCallback(() => {
    if (state.messages.length < 2) return;

    const userMessages = state.messages.filter((m) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (lastUserMessage) {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -1),
        error: null,
      }));
      sendMessage(lastUserMessage.content);
    }
  }, [state.messages, sendMessage]);

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    error: state.error,
    sendMessage,
    stopGeneration,
    clearMessages,
    setMessages,
    retryLastMessage,
  };
}
