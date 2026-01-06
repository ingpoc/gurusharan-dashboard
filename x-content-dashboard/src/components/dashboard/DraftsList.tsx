'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  EmptyState,
  CardSkeleton,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { staggerItem } from '@/lib/animations';

interface Draft {
  id: string;
  content: string;
  metadata?: string;
  scheduledAt: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'POSTED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

/**
 * DRAMS Drafts List Component
 *
 * Dieter Rams Principles:
 * - Useful: Clear actions (edit, post, delete)
 * - Understandable: Status badges, dates visible
 * - Thorough: Loading, empty, and error states
 */
export function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [postingId, setPostingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      } else {
        setError('Failed to load drafts');
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      setError('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/drafts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDrafts(drafts.filter((d) => d.id !== id));
      } else {
        setError('Failed to delete draft');
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      setError('Failed to delete draft');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (draft: Draft) => {
    setEditingId(draft.id);
    setEditContent(draft.content);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, content: editContent }),
      });

      if (res.ok) {
        setDrafts(drafts.map((d) => (d.id === editingId ? { ...d, content: editContent } : d)));
        setEditingId(null);
        setEditContent('');
      } else {
        setError('Failed to save draft');
      }
    } catch (error) {
      console.error('Failed to update draft:', error);
      setError('Failed to save draft');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handlePostNow = async (id: string) => {
    if (!confirm('Post this draft to X now?')) return;

    setPostingId(id);
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setDrafts(drafts.filter((d) => d.id !== id));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to post');
      }
    } catch (error) {
      console.error('Failed to post draft:', error);
      setError('Failed to post draft');
    } finally {
      setPostingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading drafts"
        description={error}
        action={
          <button
            onClick={fetchDrafts}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-50 rounded-md hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (drafts.length === 0) {
    return (
      <EmptyState
        title="No drafts yet"
        description="Start a chat to create your first draft"
        action={
          <Button onClick={() => (window.location.href = '/chat')}>
            Go to Chat
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence>
        {drafts.map((draft) => (
          <motion.div
            key={draft.id}
            variants={staggerItem}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Draft</CardTitle>
                    <CardDescription>
                      {new Date(draft.createdAt).toLocaleDateString()} at{' '}
                      {new Date(draft.createdAt).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <StatusBadge status={draft.status} />
                </div>
              </CardHeader>
              <CardContent>
                {editingId === draft.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[120px] px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 resize-y"
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words m-0 text-slate-900 dark:text-slate-50">
                    {draft.content}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                {editingId === draft.id ? (
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(draft)}>
                      Edit
                    </Button>
                    {draft.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => handlePostNow(draft.id)}
                        disabled={postingId === draft.id}
                        isLoading={postingId === draft.id}
                      >
                        Post Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(draft.id)}
                      disabled={deletingId === draft.id}
                      isLoading={deletingId === draft.id}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: Draft['status'] }) {
  const styles: Record<Draft['status'], string> = {
    DRAFT: 'bg-warning-bg text-warning px-2 py-1 rounded text-xs font-medium',
    SCHEDULED: 'bg-info-bg text-info px-2 py-1 rounded text-xs font-medium',
    POSTED: 'bg-success-bg text-success px-2 py-1 rounded text-xs font-medium',
    FAILED: 'bg-error-bg text-error px-2 py-1 rounded text-xs font-medium',
  };

  return <span className={styles[status]}>{status}</span>;
}
