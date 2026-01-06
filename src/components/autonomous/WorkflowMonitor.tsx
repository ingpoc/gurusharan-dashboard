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
import { Button } from "@/components/ui/Button";

interface WorkflowStatus {
  enabled: boolean;
  currentPhase: string;
  activeWorkflow: {
    id: string;
    phase: string;
    status: string;
    startedAt: string;
    postsCreated: number;
    creditsUsed: number;
    persona: {
      id: string;
      name: string;
    };
  } | null;
  recentWorkflows: Array<{
    id: string;
    phase: string;
    status: string;
    postsCreated: number;
    creditsUsed: number;
    startedAt: string;
    completedAt: string | null;
  }>;
  creditUsage: {
    totalCredits: number;
    todayCredits: number;
    remainingBudget: number;
  };
}

/**
 * Workflow Monitor Component
 *
 * Displays autonomous workflow status with real-time updates,
 * start/stop controls, activity feed, and credit usage tracking.
 */
export function WorkflowMonitor() {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll status every 2 seconds for real-time updates
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/autonomous/status?limit=5");
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = await res.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/autonomous/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: status?.activeWorkflow?.persona.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start workflow");
      }
      // Refresh status after starting
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsStarting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString() + ", " + date.toLocaleDateString();
  };

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      IDLE: "text-slate-500",
      RESEARCHING: "text-blue-500",
      SYNTHESIZING: "text-purple-500",
      DRAFTING: "text-indigo-500",
      REVIEWING: "text-amber-500",
      POSTING: "text-green-500",
      LEARNING: "text-cyan-500",
      COMPLETED: "text-green-600",
      FAILED: "text-red-500",
    };
    return colors[phase] || "text-slate-600";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "text-slate-500",
      RUNNING: "text-blue-500",
      PAUSED: "text-amber-500",
      COMPLETED: "text-green-600",
      FAILED: "text-red-500",
    };
    return colors[status] || "text-slate-600";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="animate-pulse py-8">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-error text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const dailyBudget = 33;
  const creditsUsed = status.creditUsage.todayCredits;
  const creditsPercent = (creditsUsed / dailyBudget) * 100;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Autonomous Workflow</CardTitle>
              <CardDescription>
                {status.enabled ? "Enabled" : "Disabled"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {status.activeWorkflow ? (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              ) : (
                <span className="flex h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              )}
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {status.activeWorkflow ? "Running" : "Idle"}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Phase */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Current Phase
            </h4>
            <p className={`text-2xl font-semibold ${getPhaseColor(status.currentPhase)}`}>
              {status.currentPhase}
            </p>
          </div>

          {/* Active Workflow */}
          {status.activeWorkflow && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Status:</span>
                <span className={getStatusColor(status.activeWorkflow.status)}>
                  {status.activeWorkflow.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Posts Created:</span>
                <span className="text-slate-900 dark:text-slate-50">
                  {status.activeWorkflow.postsCreated}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Credits Used:</span>
                <span className="text-slate-900 dark:text-slate-50">
                  {status.activeWorkflow.creditsUsed}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Started:</span>
                <span className="text-slate-900 dark:text-slate-50">
                  {formatTime(status.activeWorkflow.startedAt)}
                </span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {!status.activeWorkflow && status.enabled && (
              <Button
                onClick={handleStart}
                isLoading={isStarting}
                disabled={!status.enabled}
              >
                Start Workflow
              </Button>
            )}
            {!status.enabled && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Enable autonomous mode in settings to start workflows
              </div>
            )}
          </div>

          {/* Credit Usage Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-700 dark:text-slate-300">
                Today's Credit Usage
              </span>
              <span className="text-slate-900 dark:text-slate-50">
                {creditsUsed} / {dailyBudget}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(creditsPercent, 100)}%` }}
                transition={{ duration: 0.5 }}
                className={`h-2 rounded-full ${
                  creditsPercent > 90
                    ? "bg-red-500"
                    : creditsPercent > 70
                    ? "bg-amber-500"
                    : "bg-green-500"
                }`}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {status.creditUsage.remainingBudget} credits remaining today
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest workflow runs</CardDescription>
        </CardHeader>
        <CardContent>
          {status.recentWorkflows.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {status.recentWorkflows.map((workflow) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {workflow.phase}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatTime(workflow.startedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={getStatusColor(workflow.status)}>
                      {workflow.status}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {workflow.postsCreated} posts
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {workflow.creditsUsed} credits
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
