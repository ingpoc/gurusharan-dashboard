import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  try {
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

    return NextResponse.json({
      postsToday,
      postsRemaining,
      totalPosts,
      totalDrafts,
    });
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
