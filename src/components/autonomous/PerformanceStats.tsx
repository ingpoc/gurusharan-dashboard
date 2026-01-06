"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";

interface WorkflowRun {
  id: string;
  phase: string;
  status: string;
  postsCreated: number;
  creditsUsed: number;
  startedAt: string;
  completedAt: string | null;
  persona: {
    name: string;
  };
}

interface TopPost {
  id: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  postedAt: string;
}

/**
 * Performance Stats Component
 *
 * Displays workflow history, top performing posts,
 * credit usage trends, and engagement metrics.
 */
export function PerformanceStats() {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch workflows
        const runsRes = await fetch("/api/autonomous/status?limit=20");
        if (runsRes.ok) {
          const runsData = await runsRes.json();
          setWorkflows(runsData.recentWorkflows || []);
        }

        // Fetch top posts
        const postsRes = await fetch("/api/stats/top-posts");
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setTopPosts(postsData.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch performance data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: "text-green-600 dark:text-green-400",
      FAILED: "text-red-600 dark:text-red-400",
      RUNNING: "text-blue-600 dark:text-blue-400",
      PENDING: "text-slate-500",
    };
    return colors[status] || "text-slate-600";
  };

  const totalCredits = workflows.reduce((sum, w) => sum + w.creditsUsed, 0);
  const totalPosts = workflows.reduce((sum, w) => sum + w.postsCreated, 0);
  const completedRuns = workflows.filter((w) => w.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {completedRuns}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Completed Workflows
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {totalPosts}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Posts Created
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {totalCredits}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Credits Used
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow History</CardTitle>
          <CardDescription>Recent autonomous workflow runs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-200 dark:bg-slate-700 rounded"
                />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No workflow history yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                      Started
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                      Persona
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                      Phase
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                      Posts
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                      Credits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((workflow, index) => (
                    <motion.tr
                      key={workflow.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-400">
                        {formatDate(workflow.startedAt)}
                      </td>
                      <td className="py-3 px-2 text-slate-900 dark:text-slate-50">
                        {workflow.persona?.name || "-"}
                      </td>
                      <td className="py-3 px-2 text-slate-900 dark:text-slate-50">
                        {workflow.phase}
                      </td>
                      <td className={`py-3 px-2 ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-900 dark:text-slate-50">
                        {workflow.postsCreated}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-900 dark:text-slate-50">
                        {workflow.creditsUsed}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Posts with highest engagement</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-200 dark:bg-slate-700 rounded"
                />
              ))}
            </div>
          ) : topPosts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No posts yet. Engagement data will appear here after posts start
              getting engagement.
            </p>
          ) : (
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4"
                >
                  <p className="text-sm text-slate-900 dark:text-slate-50 mb-3">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      {post.retweets}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {post.replies}
                    </span>
                    <span className="ml-auto text-slate-500">
                      {formatDate(post.postedAt)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage Over Time</CardTitle>
          <CardDescription>Daily credit consumption trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-1">
            {workflows.slice(0, 14).reverse().map((workflow, index) => {
              const height = Math.min((workflow.creditsUsed / 50) * 100, 100);
              return (
                <motion.div
                  key={workflow.id}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t relative group"
                >
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {workflow.creditsUsed} credits
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Oldest</span>
            <span>Recent</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
