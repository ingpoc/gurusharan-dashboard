import { NextResponse } from 'next/server';

/**
 * GET /api/scheduler/status
 *
 * Returns the current status of the job scheduler:
 * - initialized: Whether scheduler has been initialized
 * - jobsCount: Number of active scheduled jobs
 * - runningWorkflow: Whether a workflow is currently running
 * - jobs: Array of job IDs
 */
export async function GET() {
  try {
    const { scheduler } = await import('@/lib/scheduler');
    const status = scheduler.getStatus();

    return NextResponse.json(status);
  } catch (error) {
    console.error('[Scheduler Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status', details: (error as Error).message },
      { status: 500 }
    );
  }
}
