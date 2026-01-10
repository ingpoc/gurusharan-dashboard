import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('[API /stats] Handling request');

    // Get today's post count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const postsToday = await prisma.post.count({
      where: { postedAt: { gte: today } },
    });

    // Get total posts
    const totalPosts = await prisma.post.count();

    // Get total drafts
    const totalDrafts = await prisma.draft.count();

    // Free tier X API: 17 posts/day
    const postsRemaining = Math.max(0, 17 - postsToday);

    console.log('[API /stats] Success:', { postsToday, totalPosts, totalDrafts });

    return NextResponse.json({
      postsToday,
      postsRemaining,
      totalPosts,
      totalDrafts,
    });
  } catch (error) {
    console.error('[API /stats] Error:', error);

    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}
