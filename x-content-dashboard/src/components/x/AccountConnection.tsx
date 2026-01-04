'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';

interface ConnectionStatus {
  connected: boolean;
  username: string | null;
  needsRefresh: boolean;
}

export function AccountConnection() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/x/status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setConnecting(true);
    // Redirect to OAuth initiation endpoint
    window.location.href = '/api/auth/x/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your X account?')) return;

    try {
      await fetch('/api/auth/x/disconnect', { method: 'POST' });
      setStatus({ connected: false, username: null, needsRefresh: false });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        X Account Connection
      </h3>

      {status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Connected as @{status.username}
              </p>
              {status.needsRefresh && (
                <p className="text-xs text-amber-600 mt-1">
                  Session expires soon - will refresh automatically
                </p>
              )}
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleDisconnect}
            className="w-full"
          >
            Disconnect Account
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your X account to enable posting and engagement tracking.
          </p>

          <Button
            variant="primary"
            onClick={handleConnect}
            disabled={connecting}
            className="w-full"
          >
            {connecting ? 'Connecting...' : 'Connect X Account'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Uses OAuth 2.0 - Your credentials are secure
          </p>
        </div>
      )}
    </motion.div>
  );
}
