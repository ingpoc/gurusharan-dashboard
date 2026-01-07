'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  EmptyState,
  CardSkeleton,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { staggerItem } from '@/lib/animations';

interface Post {
  id: string;
  tweetId: string;
  content: string;
  postedAt: string;
  likes: number;
  retweets: number;
  replies: number;
}

/**
 * DRAMS Posts List Component
 *
 * Displays tweeted content
 *
 * Dieter Rams Principles:
 * - Useful: View posted tweets, links to X
 * - Understandable: Date, engagement visible
 * - Thorough: Loading, empty states
 */
export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        setError('Failed to load posts');
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading posts"
        description={error}
        action={
          <button
            onClick={fetchPosts}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-50 rounded-md hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title="No posts yet"
        description="Posts you make will appear here"
      />
    );
  }

  const getXUsername = () => {
    // Try to get X username from settings or use default
    return 'techtrends3107';
  };

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence>
        {posts.map((post) => (
          <motion.div
            key={post.id}
            variants={staggerItem}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Posted</CardTitle>
                    <CardDescription>
                      {new Date(post.postedAt).toLocaleDateString()} at{' '}
                      {new Date(post.postedAt).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(
                      `https://x.com/${getXUsername()}/status/${post.tweetId}`,
                      '_blank'
                    )}
                  >
                    View on X
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words m-0 text-slate-900 dark:text-slate-50">
                  {post.content}
                </p>
              </CardContent>
              <CardContent className="pt-0">
                <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <span>♥ {post.likes}</span>
                  <span>↻ {post.retweets}</span>
                  <span>💬 {post.replies}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
