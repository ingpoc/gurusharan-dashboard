'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AccountConnection } from '@/components/x';
import { PersonaEditor } from '@/components/settings';
import { MainLayout, Header } from '@/components/layout';

interface SettingsData {
  persona: {
    name: string;
    topics: string[];
    tone: string;
    style: string;
    hashtagUsage: boolean;
    emojiUsage: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSave = async (persona: SettingsData['persona']) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      });

      if (res.ok) {
        setSettings({ ...settings!, persona });
        alert('Persona saved!');
      }
    } catch (error) {
      console.error('Failed to save persona:', error);
      alert('Failed to save persona');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Header title="Settings" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1 }}
          className="space-y-6"
        >
          {/* X Account Connection */}
          <AccountConnection />

          {/* Persona Configuration */}
          {!loading && (
            <PersonaEditor
              persona={settings?.persona || getDefaultPersona()}
              onSave={handlePersonaSave}
            />
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}

function getDefaultPersona(): SettingsData['persona'] {
  return {
    name: '',
    topics: [],
    tone: 'professional',
    style: 'informative',
    hashtagUsage: true,
    emojiUsage: false,
  };
}
