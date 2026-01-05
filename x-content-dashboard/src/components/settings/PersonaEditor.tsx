'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Card } from '@/components/ui';

interface Persona {
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

  const handleAddTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData({ ...formData, topics: [...formData.topics, topicInput.trim()] });
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setFormData({ ...formData, topics: formData.topics.filter((t) => t !== topic) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Configuration</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topics
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
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
                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  className="hover:text-orange-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tone
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((tone) => (
              <label
                key={tone}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.tone === tone
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  value={tone}
                  checked={formData.tone === tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="text-orange-500"
                />
                <span className="capitalize text-sm">{tone}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_OPTIONS.map((style) => (
              <label
                key={style}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.style === style
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="style"
                  value={style}
                  checked={formData.style === style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="text-orange-500"
                />
                <span className="capitalize text-sm">{style}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hashtagUsage}
              onChange={(e) => setFormData({ ...formData, hashtagUsage: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded"
            />
            <span className="text-sm text-gray-700">Use hashtags in posts</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.emojiUsage}
              onChange={(e) => setFormData({ ...formData, emojiUsage: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded"
            />
            <span className="text-sm text-gray-700">Use emojis in posts</span>
          </label>
        </div>

        {/* Preview */}
        <Card className="p-4 bg-gray-50 border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">PREVIEW</p>
          <p className="text-sm text-gray-700">
            <strong>{formData.name || 'Your Persona'}</strong> writes in a{' '}
            <strong>{formData.tone}</strong> tone with <strong>{formData.style}</strong> style.
            {formData.topics.length > 0 && (
              <>
                {' '}Topics: <strong>{formData.topics.join(', ')}</strong>
              </>
            )}
          </p>
        </Card>

        {/* Save Button */}
        <Button type="submit" variant="primary" className="w-full">
          Save Persona
        </Button>
      </form>
    </motion.div>
  );
}
