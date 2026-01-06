import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/chat/sessions - List all chat sessions
 */
export async function GET() {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

/**
 * POST /api/chat/sessions - Create new chat session
 */
export async function POST() {
  try {
    const session = await prisma.chatSession.create({ data: {} });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session POST error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
