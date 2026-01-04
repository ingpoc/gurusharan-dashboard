import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'edge';

// GET settings
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        persona: {
          name: '',
          topics: [],
          tone: 'professional',
          style: 'informative',
          hashtagUsage: true,
          emojiUsage: false,
        },
      });
    }

    return NextResponse.json({
      persona: JSON.parse(settings.persona || '{}'),
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT settings (update persona)
export async function PUT(req: NextRequest) {
  try {
    const { persona } = await req.json();

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona data required' },
        { status: 400 }
      );
    }

    // Get or create settings
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }

    // Update persona
    const updated = await prisma.settings.update({
      where: { id: settings.id },
      data: { persona: JSON.stringify(persona) },
    });

    return NextResponse.json({
      persona: JSON.parse(updated.persona || '{}'),
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
