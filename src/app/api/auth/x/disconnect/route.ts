import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Disconnect X account
export async function POST(req: NextRequest) {
  try {
    // Get settings record
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: 'No settings found' },
        { status: 404 }
      );
    }

    // Clear X account data
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        xUserId: null,
        xUsername: null,
        xAccessToken: null,
        xRefreshToken: null,
        xTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
