import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getWorkflowRuns, getCreditUsageSummary } from '@/lib/autonomous-workflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/autonomous/status - Get autonomous workflow status
 *
 * Returns:
 * - enabled: boolean (is autonomous mode enabled)
 * - currentPhase: string (current workflow phase or IDLE)
 * - activeWorkflow: object (current workflow run if active)
 * - recentWorkflows: array (recent workflow runs)
 * - creditUsage: object (credit usage summary)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get settings
    const settings = await prisma.settings.findFirst();

    // Get current active workflow
    const activeWorkflow = await prisma.workflowRun.findFirst({
      where: {
        status: 'RUNNING',
      },
      include: {
        persona: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    // Get recent workflows
    const recentWorkflows = await getWorkflowRuns(limit);

    // Get credit usage
    const creditUsage = await getCreditUsageSummary();

    return NextResponse.json({
      enabled: settings?.autonomousEnabled ?? false,
      currentPhase: activeWorkflow?.phase || 'IDLE',
      activeWorkflow: activeWorkflow || null,
      recentWorkflows: recentWorkflows.slice(0, limit),
      creditUsage,
    });
  } catch (error) {
    console.error('[Autonomous API] Status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
