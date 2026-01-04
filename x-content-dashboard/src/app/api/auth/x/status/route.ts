import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Get X connection status
export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.settings.findFirst();

    if (!settings || !settings.xUserId) {
      return NextResponse.json({
        connected: false,
        username: null,
      });
    }

    // Check if token needs refresh
    const needsRefresh =
      settings.xTokenExpiry &&
      new Date(settings.xTokenExpiry) < new Date(Date.now() + 5 * 60 * 1000); // 5 min buffer

    return NextResponse.json({
      connected: true,
      username: settings.xUsername,
      needsRefresh,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
