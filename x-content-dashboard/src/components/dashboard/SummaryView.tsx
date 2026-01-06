'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardSkeleton, EmptyState } from '@/components/ui';

interface Stats {
  postsToday: number;
  postsRemaining: number;
  totalPosts: number;
  totalDrafts: number;
}

interface AccountStatus {
  connected: boolean;
  username: string | null;
}

/**
 * DRAMS Summary View Component
 *
 * Dieter Rams Principles:
 * - Honest: Accurate stats, loading states
 * - Thorough: Empty state, account status
 * - Aesthetic: Clean stat cards with minimal colors
 */
export function SummaryView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError('Failed to load stats');
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setError('Failed to load stats');
      }
    };

    const fetchAccountStatus = async () => {
      try {
        const res = await fetch('/api/auth/x/status');
        if (res.ok) {
          const data = await res.json();
          setAccount(data);
        }
      } catch (error) {
        console.error('Failed to fetch account status:', error);
      }
    };

    Promise.all([fetchStats(), fetchAccountStatus()]).finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ErrorCard />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Posts Today"
        value={stats?.postsToday ?? 0}
        subtitle={`${stats?.postsRemaining ?? 17} remaining`}
        variant="default"
      />
      <StatCard
        title="Total Posts"
        value={stats?.totalPosts ?? 0}
        subtitle="All time"
        variant="success"
      />
      <StatCard
        title="Drafts"
        value={stats?.totalDrafts ?? 0}
        subtitle="Saved drafts"
        variant="info"
      />
      <AccountCard account={account} />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  variant = 'default',
}: {
  title: string;
  value: number;
  subtitle: string;
  variant?: 'default' | 'success' | 'info';
}) {
  const variantStyles = {
    default: 'text-slate-900 dark:text-slate-50',
    success: 'text-success',
    info: 'text-info',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card hoverable>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{title}</p>
        <p className={`text-3xl font-semibold mb-1 ${variantStyles[variant]}`}>
          {value}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-500 m-0">{subtitle}</p>
      </Card>
    </motion.div>
  );
}

function AccountCard({ account }: { account: AccountStatus | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card hoverable>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">X Account</p>
        {account?.connected ? (
          <>
            <p className="text-lg font-semibold text-success mb-1">
              @{account.username}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-500 m-0">Connected</p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-error mb-1">
              Not Connected
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-500 m-0">
              <a
                href="/settings"
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Connect in Settings →
              </a>
            </p>
          </>
        )}
      </Card>
    </motion.div>
  );
}

function ErrorCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-full"
    >
      <EmptyState
        title="Unable to load dashboard"
        description="There was a problem loading your statistics. Please try again."
        action={
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-50 rounded-md hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            Retry
          </button>
        }
      />
    </motion.div>
  );
}
