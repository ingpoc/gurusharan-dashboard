'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AccountConnection } from '@/components/x';
import { PersonaEditor, PersonasList } from '@/components/settings';
import { MainLayout } from '@/components/layout';

interface Persona {
  id: string;
  name: string;
  topics: string[];
  tone: string;
  style: string;
  hashtagUsage: boolean;
  emojiUsage: boolean;
}

export default function SettingsPage() {
  const [currentPersonaId, setCurrentPersonaId] = useState<string | undefined>();
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [personasRefreshKey, setPersonasRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load selected persona
  useEffect(() => {
    if (!currentPersonaId) {
      setCurrentPersona(null);
      setLoading(false);
      return;
    }

    const fetchPersona = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/personas/${currentPersonaId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentPersona({
            id: data.id,
            name: data.name,
            topics: JSON.parse(data.topics || '[]'),
            tone: data.tone,
            style: data.style,
            hashtagUsage: data.hashtagUsage,
            emojiUsage: data.emojiUsage,
          });
        }
      } catch (error) {
        console.error('Failed to load persona:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPersona();
  }, [currentPersonaId]);

  const handlePersonaSave = async (persona: Persona) => {
    try {
      const res = await fetch(`/api/personas/${currentPersonaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      });

      if (res.ok) {
        setPersonasRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to save persona:', error);
      throw error;
    }
  };

  return (
    <MainLayout title="Settings">
      <div className="h-[calc(100vh-64px-3rem)] flex gap-4">
        {/* Personas Sidebar */}
        <PersonasList
          currentPersonaId={currentPersonaId}
          triggerRefresh={personasRefreshKey}
          onPersonaSelect={setCurrentPersonaId}
        />

        {/* Settings Content */}
        <div className="flex-1 max-w-4xl overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ staggerChildren: 0.1 }}
            className="p-6 space-y-6"
          >
            {/* X Account Connection */}
            <AccountConnection />

            {/* Persona Configuration */}
            {!loading && currentPersona && (
              <PersonaEditor
                key={currentPersona.id}
                persona={currentPersona}
                onSave={handlePersonaSave}
              />
            )}

            {!loading && !currentPersona && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500">Select or create a persona to edit</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
