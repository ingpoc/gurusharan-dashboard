'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Card } from '@/components/ui';

interface Persona {
  id?: string;
  name: string;
  topics: string[];
  tone: string;
  style: string;
  hashtagUsage: boolean;
  emojiUsage: boolean;
}

interface PersonaEditorProps {
  persona: Persona;
  onSave: (persona: Persona) => void;
}

const TONE_OPTIONS = ['professional', 'casual', 'friendly', 'authoritative'];
const STYLE_OPTIONS = ['informative', 'engaging', 'concise', 'storytelling'];

/**
 * DRAMS Persona Editor Component
 *
 * Dieter Rams Principles:
 * - Understandable: Clear section dividers, visual feedback
 * - Honest: Live preview shows what you'll get
 * - Thorough: Validation messages, save/fail states
 */
export function PersonaEditor({ persona, onSave }: PersonaEditorProps) {
  const [formData, setFormData] = useState<Persona>({
    name: persona.name || '',
    topics: persona.topics || [],
    tone: persona.tone || 'professional',
    style: persona.style || 'informative',
    hashtagUsage: persona.hashtagUsage ?? true,
    emojiUsage: persona.emojiUsage ?? false,
  });
  const [topicInput, setTopicInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAddTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData({ ...formData, topics: [...formData.topics, topicInput.trim()] });
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setFormData({ ...formData, topics: formData.topics.filter((t) => t !== topic) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await onSave(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
        Persona Configuration
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Persona Name
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Tech Trends Expert"
            required
          />
        </div>

        {/* Topics */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Topics
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
              placeholder="e.g., AI, Web3, Startups"
            />
            <Button type="button" variant="secondary" onClick={handleAddTopic}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(formData.topics || []).map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning-bg text-warning rounded-full text-sm font-medium"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  className="hover:text-warning-dark transition-colors"
                  aria-label={`Remove ${topic} topic`}
                >
                  ×
                </button>
              </span>
            ))}
            {formData.topics.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                No topics added yet
              </p>
            )}
          </div>
        </div>

        {/* Tone - Radio Cards */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tone
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((tone) => (
              <label
                key={tone}
                className={`
                  flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                  ${
                    formData.tone === tone
                      ? 'border-slate-900 bg-slate-100 dark:border-slate-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="tone"
                  value={tone}
                  checked={formData.tone === tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="text-slate-900 dark:text-slate-50"
                />
                <span className="capitalize text-sm text-slate-900 dark:text-slate-50">
                  {tone}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Style - Radio Cards */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Content Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_OPTIONS.map((style) => (
              <label
                key={style}
                className={`
                  flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                  ${
                    formData.style === style
                      ? 'border-slate-900 bg-slate-100 dark:border-slate-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="style"
                  value={style}
                  checked={formData.style === style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="text-slate-900 dark:text-slate-50"
                />
                <span className="capitalize text-sm text-slate-900 dark:text-slate-50">
                  {style}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.hashtagUsage}
              onChange={(e) => setFormData({ ...formData, hashtagUsage: e.target.checked })}
              className="w-4 h-4 text-slate-900 dark:text-slate-50 rounded border-slate-300 dark:border-slate-600 focus:ring-slate-400 dark:focus:ring-slate-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
              Use hashtags in posts
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.emojiUsage}
              onChange={(e) => setFormData({ ...formData, emojiUsage: e.target.checked })}
              className="w-4 h-4 text-slate-900 dark:text-slate-50 rounded border-slate-300 dark:border-slate-600 focus:ring-slate-400 dark:focus:ring-slate-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
              Use emojis in posts
            </span>
          </label>
        </div>

        {/* Section Divider */}
        <div className="border-t border-slate-200 dark:border-slate-700" />

        {/* Live Preview */}
        <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" padding="md">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
            Preview
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-50">
              {formData.name || 'Your Persona'}
            </strong>{' '}writes in a{' '}
            <strong className="text-slate-900 dark:text-slate-50">{formData.tone}</strong> tone with{' '}
            <strong className="text-slate-900 dark:text-slate-50">{formData.style}</strong> style.
            {formData.topics.length > 0 && (
              <>
                {' '}Topics:{' '}
                <strong className="text-slate-900 dark:text-slate-50">
                  {formData.topics.join(', ')}
                </strong>
              </>
            )}
            {formData.hashtagUsage && <>, uses hashtags</>}
            {formData.emojiUsage && <>, uses emojis</>}
          </p>
        </Card>

        {/* Save Button with Status */}
        <div className="flex gap-2 items-center">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSaving}
            isLoading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Persona'}
          </Button>

          {/* Status indicator */}
          {saveStatus === 'success' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-success flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved
            </motion.span>
          )}
          {saveStatus === 'error' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-error flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Failed
            </motion.span>
          )}
        </div>
      </form>
    </motion.div>
  );
}
