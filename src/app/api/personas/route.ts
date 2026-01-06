import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/personas - List all personas
 */
export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(personas);
  } catch (error) {
    console.error('Personas GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
  }
}

/**
 * POST /api/personas - Create new persona
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const persona = await prisma.persona.create({
      data: {
        name: body.name,
        topics: JSON.stringify(body.topics || []),
        tone: body.tone,
        style: body.style,
        hashtagUsage: body.hashtagUsage ?? true,
        emojiUsage: body.emojiUsage ?? false,
        isActive: false,
      },
    });

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Persona POST error:', error);
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
}
