'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';

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

export function SummaryView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Posts Today"
        value={stats?.postsToday ?? 0}
        subtitle={`${stats?.postsRemaining ?? 17} remaining`}
        color="#ff611a"
      />
      <StatCard
        title="Total Posts"
        value={stats?.totalPosts ?? 0}
        subtitle="All time"
        color="#22c55e"
      />
      <StatCard
        title="Drafts"
        value={stats?.totalDrafts ?? 0}
        subtitle="Saved drafts"
        color="#3b82f6"
      />
      <AccountCard account={account} />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card hoverable>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</p>
        <p style={{ fontSize: '2rem', fontWeight: 600, color, marginBottom: '0.25rem' }}>{value}</p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>{subtitle}</p>
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
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>X Account</p>
        {account?.connected ? (
          <>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#22c55e', marginBottom: '0.25rem' }}>
              @{account.username}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Connected</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.25rem' }}>
              Not Connected
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
              <a href="/settings" style={{ color: '#ff611a', textDecoration: 'none' }}>
                Connect in Settings →
              </a>
            </p>
          </>
        )}
      </Card>
    </motion.div>
  );
}
