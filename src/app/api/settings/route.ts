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
        autonomousEnabled: false,
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
      autonomousEnabled: settings.autonomousEnabled ?? false,
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
    const { persona, autonomousEnabled } = await req.json();

    // Get or create settings
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }

    // Update autonomousEnabled if provided
    if (autonomousEnabled !== undefined) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { autonomousEnabled },
      });
    }

    // Update persona if provided
    let activePersona;
    if (persona) {
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
    } else if (settings.activePersonaId) {
      // Fetch existing active persona
      activePersona = await prisma.persona.findUnique({
        where: { id: settings.activePersonaId },
      });
    }

    // Refresh settings to get latest autonomousEnabled
    settings = await prisma.settings.findFirst({
      where: { id: settings.id },
      include: { activePersona: true },
    });

    return NextResponse.json({
      persona: activePersona ? {
        id: activePersona.id,
        name: activePersona.name,
        topics: JSON.parse(activePersona.topics || '[]'),
        tone: activePersona.tone,
        style: activePersona.style,
        hashtagUsage: activePersona.hashtagUsage,
        emojiUsage: activePersona.emojiUsage,
      } : null,
      autonomousEnabled: settings?.autonomousEnabled ?? false,
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
