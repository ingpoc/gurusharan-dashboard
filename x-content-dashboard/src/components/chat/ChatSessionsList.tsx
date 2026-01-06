'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fadeIn } from '@/lib/animations';

interface ChatSession {
  id: string;
  messages: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSessionsListProps {
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onNewChat?: () => void;
  triggerRefresh?: number;
}

/**
 * DRAMS Chat Sessions Sidebar
 *
 * Dieter Rams Principles:
 * - Understandable: Clear session list
 * - Unobtrusive: Collapsible on mobile
 * - Useful: Shows last message preview
 */
export function ChatSessionsList({
  currentSessionId,
  onSessionSelect,
  onNewChat,
  triggerRefresh,
}: ChatSessionsListProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [triggerRefresh]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/chat/sessions', { method: 'POST' });
      if (res.ok) {
        const newSession = await res.json();
        setSessions([newSession, ...sessions]);
        onSessionSelect?.(newSession.id);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const getSessionTitle = (messagesStr: string): string => {
    try {
      const messages = JSON.parse(messagesStr);
      const firstUserMessage = messages.find((m: any) => m.role === 'user');
      if (firstUserMessage) {
        const content = firstUserMessage.content;
        return content.length > 30 ? content.slice(0, 30) + '...' : content;
      }
    } catch {}
    return 'New Chat';
  };

  return (
    <motion.aside
      {...fadeIn}
      className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col"
    >
      {/* Header + New Chat */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Chat History
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {sessions.length}
          </span>
        </div>
        <button
          onClick={handleNewChat}
          className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-8 text-sm text-slate-500">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">No chats yet</div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSessionSelect?.(session.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${currentSessionId === session.id
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }
                  `}
                >
                  <div className="font-medium truncate">
                    {getSessionTitle(session.messages)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.aside>
  );
}
