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

/**
 * DRAMS Tool Execution Card Component
 *
 * Dieter Rams Principles:
 * - Honest: Clear status indicators (running, success, error)
 * - Understandable: Tool name, parameters, results visible
 * - Thorough: Loading and error states
 */
export function ToolExecutionCard({
  toolName,
  parameters,
  status,
  result,
  error,
}: ToolExecutionCardProps) {
  const icon = toolIcons[toolName] || '🔧';
  const displayName = toolName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Status colors
  const statusColors = {
    running: 'border-warning bg-yellow-50 dark:bg-yellow-950/30',
    success: 'border-success bg-success-bg',
    error: 'border-error bg-error-bg',
  };

  const statusIcons = {
    running: (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="text-warning"
        aria-label="Running"
      >
        ⏳
      </motion.span>
    ),
    success: (
      <span className="text-success" aria-label="Success">
        ✓
      </span>
    ),
    error: (
      <span className="text-error" aria-label="Error">
        ✕
      </span>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="mb-2 last:mb-0"
    >
      <div
        className={`
          p-3 rounded-lg border-l-4
          ${statusColors[status]}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg" aria-hidden="true">
            {icon}
          </span>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
            {displayName}
          </span>
          <span className="ml-auto">{statusIcons[status]}</span>
        </div>

        {/* Parameters */}
        {parameters != null && Object.keys(parameters).length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
              Parameters:
            </p>
            <div className="flex flex-col gap-1">
              {Object.entries(parameters).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {key}:
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 overflow-hidden text-ellipsis">
                    {JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {status === 'success' && result != null && (
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
              Result:
            </p>
            <div
              className={`
                text-xs p-2 rounded
                bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
              `}
            >
              {typeof result === 'object' ? (
                <pre className="whitespace-pre-wrap word-break-word font-mono m-0">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : (
                <p className="m-0">{String(result)}</p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && error != null && (
          <div role="alert">
            <p className="text-sm text-error bg-error-bg p-2 rounded border border-error m-0">
              {error}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
