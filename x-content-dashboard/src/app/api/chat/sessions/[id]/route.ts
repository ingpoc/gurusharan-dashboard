import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

interface SaveMessagesRequest {
  messages: Array<{ role: string; content: string; timestamp: string }>;
}

/**
 * GET /api/chat/sessions/[id] - Load session messages
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.chatSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}

/**
 * PUT /api/chat/sessions/[id] - Save messages to session
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { messages }: SaveMessagesRequest = await req.json();

    const session = await prisma.chatSession.update({
      where: { id },
      data: {
        messages: JSON.stringify(messages),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session PUT error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/sessions/[id] - Delete session
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.chatSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
