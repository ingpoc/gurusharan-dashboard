"use client";

import { MainLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { WorkflowMonitor } from "@/components/autonomous/WorkflowMonitor";
import { PerformanceStats } from "@/components/autonomous/PerformanceStats";

export default function AutonomousPage() {
  return (
    <MainLayout title="Autonomous Workflow">
      <div className="space-y-6">
        {/* Workflow Monitor */}
        <WorkflowMonitor />

        {/* Performance Stats */}
        <PerformanceStats />
      </div>
    </MainLayout>
  );
}
