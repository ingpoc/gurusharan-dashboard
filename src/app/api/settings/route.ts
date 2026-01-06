import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET settings
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      include: { activePersona: true },
    });

    if (!settings || !settings.activePersona) {
      // Return default settings
      return NextResponse.json({
        persona: {
          id: '',
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
      persona: {
        id: settings.activePersona.id,
        name: settings.activePersona.name,
        topics: JSON.parse(settings.activePersona.topics || '[]'),
        tone: settings.activePersona.tone,
        style: settings.activePersona.style,
        hashtagUsage: settings.activePersona.hashtagUsage,
        emojiUsage: settings.activePersona.emojiUsage,
      },
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

    // Find or update the active persona
    let activePersona;
    if (settings.activePersonaId) {
      // Update existing persona
      activePersona = await prisma.persona.update({
        where: { id: settings.activePersonaId },
        data: {
          name: persona.name,
          topics: JSON.stringify(persona.topics || []),
          tone: persona.tone,
          style: persona.style,
          hashtagUsage: persona.hashtagUsage ?? true,
          emojiUsage: persona.emojiUsage ?? false,
        },
      });
    } else {
      // Create new persona and link it
      activePersona = await prisma.persona.create({
        data: {
          name: persona.name,
          topics: JSON.stringify(persona.topics || []),
          tone: persona.tone,
          style: persona.style,
          hashtagUsage: persona.hashtagUsage ?? true,
          emojiUsage: persona.emojiUsage ?? false,
          isActive: true,
        },
      });

      // Link to settings
      await prisma.settings.update({
        where: { id: settings.id },
        data: { activePersonaId: activePersona.id },
      });
    }

    return NextResponse.json({
      persona: {
        id: activePersona.id,
        name: activePersona.name,
        topics: JSON.parse(activePersona.topics || '[]'),
        tone: activePersona.tone,
        style: activePersona.style,
        hashtagUsage: activePersona.hashtagUsage,
        emojiUsage: activePersona.emojiUsage,
      },
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
