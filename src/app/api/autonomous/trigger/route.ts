import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startAutonomousWorkflow, getWorkflowRuns } from '@/lib/autonomous-workflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/autonomous/trigger - Start autonomous workflow
 *
 * Body:
 * - personaId: string (required)
 * - topicCount?: number (default: 5)
 * - maxPosts?: number (default: 3)
 */
export async function POST(req: NextRequest) {
  try {
    // Check if autonomous mode is enabled
    const settings = await prisma.settings.findFirst();
    if (!settings?.autonomousEnabled) {
      return NextResponse.json(
        { error: 'Autonomous mode is disabled. Enable it in settings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { personaId, topicCount, maxPosts } = body;

    if (!personaId) {
      return NextResponse.json(
        { error: 'personaId is required' },
        { status: 400 }
      );
    }

    // Verify persona exists
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Check if there's a running workflow
    const runningWorkflows = await prisma.workflowRun.findMany({
      where: {
        status: 'RUNNING',
      },
    });

    if (runningWorkflows.length > 0) {
      return NextResponse.json(
        {
          error: 'A workflow is already running',
          currentWorkflow: runningWorkflows[0],
        },
        { status: 409 }
      );
    }

    // Start workflow (fire and forget - runs in background)
    startAutonomousWorkflow({
      personaId,
      topicCount: topicCount || 5,
      maxPosts: maxPosts || 3,
    }).catch((error) => {
      console.error('[Autonomous API] Workflow error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Workflow started',
      personaId,
      personaName: persona.name,
    });
  } catch (error) {
    console.error('[Autonomous API] Trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autonomous/trigger - Get recent workflow runs
 */
export async function GET() {
  try {
    const runs = await getWorkflowRuns(10);
    return NextResponse.json(runs);
  } catch (error) {
    console.error('[Autonomous API] Get runs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs' },
      { status: 500 }
    );
  }
}
