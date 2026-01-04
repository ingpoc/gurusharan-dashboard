// X (Twitter) OAuth 2.0 PKCE Flow Utilities
import { TwitterApi } from 'twitter-api-v2';

// X OAuth Configuration
export const X_OAUTH_CONFIG = {
  clientId: process.env.X_CLIENT_ID || '',
  // Redirect URI must match X Developer Portal settings
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth/x/callback`,
  scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
};

// PKCE Code Challenge Methods
export async function generatePKCE() {
  // Generate random code verifier (43-128 chars)
  const verifier = await generateRandomString(128);

  // Generate code challenge (S256 method = BASE64URL(SHA256(verifier)))
  const challenge = await generateCodeChallenge(verifier);

  return { verifier, challenge };
}

// Generate cryptographically secure random string
async function generateRandomString(length: number): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = await crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (byte) => chars[byte % chars.length]).join('');
}

// Generate SHA-256 code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate X OAuth authorization URL
export function getAuthUrl(challenge: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: X_OAUTH_CONFIG.clientId,
    redirect_uri: X_OAUTH_CONFIG.redirectUri,
    scope: X_OAUTH_CONFIG.scopes.join(' '),
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  code: string,
  verifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const basicAuth = btoa(
    `${X_OAUTH_CONFIG.clientId}:${process.env.X_CLIENT_SECRET}`
  );

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: X_OAUTH_CONFIG.redirectUri,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const basicAuth = btoa(
    `${X_OAUTH_CONFIG.clientId}:${process.env.X_CLIENT_SECRET}`
  );

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// Get X user info using access token
export async function getXUser(accessToken: string): Promise<{
  id: string;
  username: string;
  name: string;
}> {
  const client = new TwitterApi(accessToken);
  const user = await client.v2.me();

  return {
    id: user.data.id,
    username: user.data.username,
    name: user.data.name,
  };
}

// Store OAuth state temporarily (in-memory for dev, use Redis for production)
const oauthStates = new Map<string, { verifier: string; expiresAt: number }>();

export function storeOAuthState(state: string, verifier: string): void {
  // State expires in 10 minutes
  oauthStates.set(state, {
    verifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
}

export function getOAuthState(state: string): string | null {
  const data = oauthStates.get(state);
  if (!data) return null;

  // Check expiration
  if (Date.now() > data.expiresAt) {
    oauthStates.delete(state);
    return null;
  }

  oauthStates.delete(state); // One-time use
  return data.verifier;
}
