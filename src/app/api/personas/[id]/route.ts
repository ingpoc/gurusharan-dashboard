import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/personas/[id] - Get single persona
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const persona = await prisma.persona.findUnique({
      where: { id },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Persona GET error:', error);
    return NextResponse.json({ error: 'Failed to load persona' }, { status: 500 });
  }
}

/**
 * PUT /api/personas/[id] - Update persona
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const persona = await prisma.persona.update({
      where: { id },
      data: {
        name: body.name,
        topics: JSON.stringify(body.topics || []),
        tone: body.tone,
        style: body.style,
        hashtagUsage: body.hashtagUsage,
        emojiUsage: body.emojiUsage,
      },
    });

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Persona PUT error:', error);
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
  }
}

/**
 * DELETE /api/personas/[id] - Delete persona
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.persona.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Persona DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 });
  }
}
