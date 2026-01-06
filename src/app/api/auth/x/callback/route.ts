import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getXUser, getOAuthState } from '@/lib/x-oauth';
import { prisma } from '@/lib/db';

// Handle X OAuth callback
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('[OAuth Callback] Received:', { code: !!code, state: state?.substring(0, 20), error });

    // Handle user denial
    if (error) {
      console.log('[OAuth Callback] User denied access');
      return NextResponse.redirect(
        new URL('/settings?error=access_denied', req.url)
      );
    }

    if (!code || !state) {
      console.log('[OAuth Callback] Missing code or state');
      return NextResponse.redirect(
        new URL('/settings?error=invalid_callback', req.url)
      );
    }

    // Verify state and get code verifier
    console.log('[OAuth Callback] Decoding verifier from state');
    const verifier = await getOAuthState(state);
    if (!verifier) {
      console.log('[OAuth Callback] Failed to decode verifier from state:', state.substring(0, 50));
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', req.url)
      );
    }
    console.log('[OAuth Callback] Verifier decoded successfully');

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
