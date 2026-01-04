import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'edge';

// GET /api/drafts - List all drafts
export async function GET() {
  try {
    const drafts = await prisma.draft.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(drafts);
  } catch (error) {
    console.error('Drafts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

// DELETE /api/drafts - Delete a draft
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    await prisma.draft.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Drafts DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}

// PATCH /api/drafts - Update a draft
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, scheduledAt, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    const updated = await prisma.draft.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Drafts PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

// POST /api/drafts/post - Post a draft immediately to X
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    // Get the draft
    const draft = await prisma.draft.findUnique({ where: { id } });
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Get X access token
    const settings = await prisma.settings.findFirst();
    if (!settings?.xAccessToken) {
      return NextResponse.json({ error: 'X account not connected' }, { status: 400 });
    }

    // Post to X (this would call the X API)
    // For now, we'll just mark as posted
    // TODO: Implement actual X posting using twitter-api-v2

    // Save to Post history
    await prisma.post.create({
      data: {
        tweetId: `temp_${Date.now()}`,
        content: draft.content,
        postedAt: new Date(),
      },
    });

    // Update draft status
    await prisma.draft.update({
      where: { id },
      data: { status: 'POSTED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Drafts POST error:', error);
    return NextResponse.json({ error: 'Failed to post draft' }, { status: 500 });
  }
}
