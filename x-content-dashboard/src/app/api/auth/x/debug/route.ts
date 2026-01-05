import { NextResponse } from 'next/server';
import { X_OAUTH_CONFIG } from '@/lib/x-oauth';

// Debug endpoint to check OAuth config
export async function GET() {
  return NextResponse.json({
    redirectUri: X_OAUTH_CONFIG.redirectUri,
    clientId: X_OAUTH_CONFIG.clientId.substring(0, 10) + '...',
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    envVars: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      X_CLIENT_ID: process.env.X_CLIENT_ID?.substring(0, 10) + '...',
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}
