'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fadeIn } from '@/lib/animations';

interface Persona {
  id: string;
  name: string;
  topics: string;
  tone: string;
  style: string;
  hashtagUsage: boolean;
  emojiUsage: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PersonasListProps {
  currentPersonaId?: string;
  activePersonaId?: string;
  onPersonaSelect?: (personaId: string) => void;
  onNewPersona?: () => void;
  triggerRefresh?: number;
}

/**
 * DRAMS Personas Sidebar
 */
export function PersonasList({
  currentPersonaId,
  activePersonaId,
  onPersonaSelect,
  onNewPersona,
  triggerRefresh,
}: PersonasListProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonas();
  }, [triggerRefresh]);

  const fetchPersonas = async () => {
    try {
      const res = await fetch('/api/personas');
      if (res.ok) {
        const data = await res.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPersona = async () => {
    try {
      // Create a default persona
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Persona',
          topics: [],
          tone: 'professional',
          style: 'informative',
          hashtagUsage: true,
          emojiUsage: false,
        }),
      });
      if (res.ok) {
        const newPersona = await res.json();
        setPersonas([newPersona, ...personas]);
        onPersonaSelect?.(newPersona.id);

        // Set as active in settings
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            persona: {
              id: newPersona.id,
              name: newPersona.name,
              topics: [],
              tone: 'professional',
              style: 'informative',
              hashtagUsage: true,
              emojiUsage: false,
            },
          }),
        });
      }
    } catch (error) {
      console.error('Failed to create persona:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this persona?')) return;

    try {
      const res = await fetch(`/api/personas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPersonas(personas.filter((p) => p.id !== id));
        if (currentPersonaId === id) {
          onPersonaSelect?.('');
        }
      }
    } catch (error) {
      console.error('Failed to delete persona:', error);
    }
  };

  const handlePersonaSelect = async (persona: Persona) => {
    onPersonaSelect?.(persona.id);

    // Set as active in settings
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: {
            id: persona.id,
            name: persona.name,
            topics: JSON.parse(persona.topics || '[]'),
            tone: persona.tone,
            style: persona.style,
            hashtagUsage: persona.hashtagUsage,
            emojiUsage: persona.emojiUsage,
          },
        }),
      });
    } catch (error) {
      console.error('Failed to set active persona:', error);
    }
  };

  const getPersonaPreview = (persona: Persona): string => {
    const topics = JSON.parse(persona.topics || '[]');
    return `${persona.name} · ${persona.tone} · ${topics.length} topics`;
  };

  return (
    <motion.aside
      {...fadeIn}
      className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col"
    >
      {/* Header + New Persona */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Personas
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {personas.length}
          </span>
        </div>
        <button
          onClick={handleNewPersona}
          className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Persona
        </button>
      </div>

      {/* Personas List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-8 text-sm text-slate-500">Loading...</div>
        ) : personas.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">No personas yet</div>
        ) : (
          <ul className="space-y-1">
            {personas.map((persona) => (
              <li key={persona.id} className="relative group">
                <button
                  onClick={() => handlePersonaSelect(persona)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-colors pr-8
                    ${currentPersonaId === persona.id
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate flex-1">{persona.name}</div>
                    {activePersonaId === persona.id && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 truncate">
                    {getPersonaPreview(persona)}
                  </div>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(persona.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                  aria-label="Delete persona"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.aside>
  );
}
