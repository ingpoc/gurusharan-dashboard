'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
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

export function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft?')) return;

    try {
      const res = await fetch(`/api/drafts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDrafts(drafts.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
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
      }
    } catch (error) {
      console.error('Failed to update draft:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handlePostNow = async (id: string) => {
    if (!confirm('Post this draft to X now?')) return;

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
        alert(data.error || 'Failed to post');
      }
    } catch (error) {
      console.error('Failed to post draft:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card>
        <CardContent>
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--muted)' }}>No drafts yet</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              Start a chat to create your first draft
            </p>
            <Button style={{ marginTop: '1rem' }} onClick={() => (window.location.href = '/chat')}>
              Go to Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AnimatePresence>
        {drafts.map((draft) => (
          <motion.div key={draft.id} variants={staggerItem} initial="initial" animate="animate" exit={{ opacity: 0, height: 0 }}>
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '0.9375rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                ) : (
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--foreground)',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                    }}
                  >
                    {draft.content}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                {editingId === draft.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(draft)}>
                      Edit
                    </Button>
                    {draft.status === 'DRAFT' && (
                      <Button size="sm" onClick={() => handlePostNow(draft.id)}>
                        Post Now
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(draft.id)}>
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
  const styles: Record<Draft['status'], React.CSSProperties> = {
    DRAFT: {
      background: '#fef3c7',
      color: '#92400e',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
    },
    SCHEDULED: {
      background: '#dbeafe',
      color: '#1e40af',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
    },
    POSTED: {
      background: '#dcfce7',
      color: '#166534',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
    },
    FAILED: {
      background: '#fee2e2',
      color: '#991b1b',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
    },
  };

  return <span style={styles[status]}>{status}</span>;
}
