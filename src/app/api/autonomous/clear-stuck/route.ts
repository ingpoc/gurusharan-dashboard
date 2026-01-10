import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/autonomous/clear-stuck - Clear stuck workflows
 *
 * Body (optional):
 * - workflowId?: string (specific workflow to clear, or clears all RUNNING workflows stuck for >5 min)
 *
 * Returns:
 * - cleared: number (count of workflows cleared)
 * - workflows: array (details of cleared workflows)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { workflowId } = body;

    let clearedWorkflows: any[] = [];

    if (workflowId) {
      // Clear specific workflow
      const workflow = await prisma.workflowRun.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        );
      }

      const updated = await prisma.workflowRun.update({
        where: { id: workflowId },
        data: {
          status: 'COMPLETED',
          phase: 'IDLE',
          completedAt: new Date(),
          error: 'Manually cleared - was stuck',
        },
      });

      clearedWorkflows.push(updated);
      console.log(`[Autonomous API] Cleared workflow: ${workflowId}`);
    } else {
      // Clear all RUNNING workflows stuck for >5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const stuckWorkflows = await prisma.workflowRun.findMany({
        where: {
          status: 'RUNNING',
          startedAt: {
            lt: fiveMinutesAgo,
          },
        },
      });

      if (stuckWorkflows.length > 0) {
        clearedWorkflows = await prisma.workflowRun.updateMany({
          where: {
            status: 'RUNNING',
            startedAt: {
              lt: fiveMinutesAgo,
            },
          },
          data: {
            status: 'COMPLETED',
            phase: 'IDLE',
            completedAt: new Date(),
            error: 'Auto-cleared - stuck for >5 minutes',
          },
        });

        console.log(
          `[Autonomous API] Auto-cleared ${stuckWorkflows.length} stuck workflows`
        );

        clearedWorkflows = stuckWorkflows;
      }
    }

    return NextResponse.json({
      success: true,
      cleared: clearedWorkflows.length,
      workflows: clearedWorkflows.map((w) => ({
        id: w.id,
        status: w.status,
        phase: w.phase,
        personaId: w.personaId,
        startedAt: w.startedAt,
        completedAt: w.completedAt,
      })),
    });
  } catch (error) {
    console.error('[Autonomous API] Clear stuck error:', error);
    return NextResponse.json(
      { error: 'Failed to clear stuck workflows' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autonomous/clear-stuck - Get list of stuck workflows
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const minutesStuck = parseInt(searchParams.get('minutes') || '5');

    const thresholdTime = new Date(Date.now() - minutesStuck * 60 * 1000);

    const stuckWorkflows = await prisma.workflowRun.findMany({
      where: {
        status: 'RUNNING',
        startedAt: {
          lt: thresholdTime,
        },
      },
      include: {
        persona: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    const now = new Date();
    const withDuration = stuckWorkflows.map((w) => ({
      id: w.id,
      status: w.status,
      phase: w.phase,
      persona: w.persona?.name || 'Unknown',
      startedAt: w.startedAt,
      elapsedSeconds: Math.floor((now.getTime() - w.startedAt.getTime()) / 1000),
    }));

    return NextResponse.json({
      stuckCount: stuckWorkflows.length,
      minutesThreshold: minutesStuck,
      workflows: withDuration,
    });
  } catch (error) {
    console.error('[Autonomous API] Get stuck error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stuck workflows' },
      { status: 500 }
    );
  }
}
