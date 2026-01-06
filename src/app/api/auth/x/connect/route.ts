import { NextRequest, NextResponse } from 'next/server';
import { generatePKCE, getAuthUrl } from '@/lib/x-oauth';

// Initiate X OAuth flow
export async function GET(req: NextRequest) {
  try {
    // Generate PKCE verifier and challenge
    const { verifier, challenge } = await generatePKCE();

    // Generate random state parameter with encoded verifier (no server storage needed)
    const random = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const state = `${random}.${btoa(verifier)}`;

    // Build authorization URL
    const authUrl = getAuthUrl(challenge, state);

    // Redirect to X authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
