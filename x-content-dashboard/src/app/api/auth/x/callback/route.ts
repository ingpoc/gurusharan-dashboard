import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getXUser, getOAuthState } from '@/lib/x-oauth';
import { prisma } from '@/lib/db';

export const runtime = 'edge';

// Handle X OAuth callback
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle user denial
    if (error) {
      return NextResponse.redirect(
        new URL('/settings?error=access_denied', req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_callback', req.url)
      );
    }

    // Verify state and get code verifier
    const verifier = getOAuthState(state);
    if (!verifier) {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', req.url)
      );
    }

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } =
      await exchangeCodeForToken(code, verifier);

    // Get user info
    const user = await getXUser(accessToken);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Get or create settings record (singleton pattern)
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }

    // Update with X account info and tokens
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        xUserId: user.id,
        xUsername: user.username,
        xAccessToken: accessToken,
        xRefreshToken: refreshToken,
        xTokenExpiry: expiresAt,
      },
    });

    // Redirect to settings page with success
    return NextResponse.redirect(
      new URL('/settings?connected=true', req.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed', req.url)
    );
  }
}
