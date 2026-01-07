import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/scheduler/jobs
 *
 * Returns all scheduled jobs from the database with their persona relations.
 * Ordered by nextRunAt ascending (upcoming jobs first).
 */
export async function GET() {
  try {
    const jobs = await prisma.scheduledJob.findMany({
      include: { persona: true },
      orderBy: { nextRunAt: 'asc' },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('[Scheduler Jobs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduled jobs', details: (error as Error).message },
      { status: 500 }
    );
  }
}
