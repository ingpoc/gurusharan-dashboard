import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startAutonomousWorkflow } from '@/lib/autonomous-workflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/daily-content - Vercel Cron Job endpoint
 *
 * Triggered by Vercel Cron Jobs at scheduled times (9AM, 12PM, 6PM UTC)
 * Requires CRON_SECRET for security verification
 *
 * Query params:
 * - secret: CRON_SECRET environment variable (required)
 * - personaId: optional (uses active persona if not provided)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify CRON_SECRET for security
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      );
    }

    if (secret !== cronSecret) {
      console.error('[Cron] Invalid CRON_SECRET');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if autonomous mode is enabled
    const settings = await prisma.settings.findFirst();
    if (!settings?.autonomousEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Autonomous mode is disabled. Skipping.',
        skipped: true,
      });
    }

    // Check if there's a running workflow
    const runningWorkflows = await prisma.workflowRun.findMany({
      where: {
        status: 'RUNNING',
      },
    });

    if (runningWorkflows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Workflow already running. Skipping.',
        skipped: true,
        currentWorkflow: runningWorkflows[0].id,
      });
    }

    // Get persona ID from query or use active persona
    let personaId = searchParams.get('personaId');
    if (!personaId && settings.activePersonaId) {
      personaId = settings.activePersonaId;
    }

    if (!personaId) {
      return NextResponse.json({
        success: true,
        message: 'No active persona found. Skipping.',
        skipped: true,
      });
    }

    // Verify persona exists
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
    });

    if (!persona) {
      return NextResponse.json({
        success: true,
        message: 'Persona not found. Skipping.',
        skipped: true,
      });
    }

    // Start workflow (fire and forget - runs in background)
    startAutonomousWorkflow({
      personaId,
      topicCount: 5,
      maxPosts: 3,
    }).catch((error) => {
      console.error('[Cron] Workflow error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Workflow started via cron',
      personaId,
      personaName: persona.name,
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute cron job' },
      { status: 500 }
    );
  }
}
