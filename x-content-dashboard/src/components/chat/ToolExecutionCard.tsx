'use client';

import { motion } from 'framer-motion';

interface ToolExecutionCardProps {
  toolName: string;
  parameters?: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  result?: unknown;
  error?: string;
}

const toolIcons: Record<string, string> = {
  get_settings: '⚙️',
  draft_post: '✍️',
  save_draft: '💾',
  get_drafts: '📝',
  research_topic: '🔍',
  post_now: '📤',
};

function ParametersDisplay({ parameters }: { parameters: Record<string, unknown> }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Parameters:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#4b5563', fontWeight: 500 }}>{key}:</span>
            <span style={{ color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {JSON.stringify(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultDisplay({ result }: { result: unknown }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Result:</p>
      <div
        style={{
          fontSize: '0.75rem',
          color: '#1f2937',
          background: 'white',
          padding: '0.5rem',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
        }}
      >
        {typeof result === 'object' ? (
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', margin: 0 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          <p style={{ margin: 0 }}>{String(result)}</p>
        )}
      </div>
    </div>
  );
}

export function ToolExecutionCard({
  toolName,
  parameters,
  status,
  result,
  error,
}: ToolExecutionCardProps) {
  const icon = toolIcons[toolName] || '🔧';
  const displayName = toolName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div
        style={{
          padding: '0.75rem',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderLeft: `3px solid ${
            status === 'running'
              ? '#f59e0b'
              : status === 'success'
              ? '#22c55e'
              : '#ef4444'
          }`,
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.125rem' }}>{icon}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{displayName}</span>
          <span style={{ marginLeft: 'auto' }}>
            {status === 'running' && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ color: '#f59e0b' }}
              >
                ⏳
              </motion.span>
            )}
            {status === 'success' && <span style={{ color: '#22c55e' }}>✓</span>}
            {status === 'error' && <span style={{ color: '#ef4444' }}>✕</span>}
          </span>
        </div>

        {parameters != null && Object.keys(parameters).length > 0 && <ParametersDisplay parameters={parameters} />}

        {status === 'success' && result != null && <ResultDisplay result={result} />}

        {status === 'error' && error != null && (
          <div>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#dc2626',
                background: '#fef2f2',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #fecaca',
                margin: 0,
              }}
            >
              {error}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
