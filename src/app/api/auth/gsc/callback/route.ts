import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/gsc/oauth';
import { db } from '@/lib/db';
import { sites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const siteId = request.nextUrl.searchParams.get('state');

  if (!code || !siteId) {
    return NextResponse.json(
      { error: 'Missing code or state' },
      { status: 400 }
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await db
      .update(sites)
      .set({
        gscAccessToken: tokens.access_token ?? null,
        gscRefreshToken: tokens.refresh_token ?? null,
        gscTokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(sites.id, siteId));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${appUrl}/sites/${siteId}/settings?connected=true`
    );
  } catch (error) {
    console.error('GSC OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange code for tokens' },
      { status: 500 }
    );
  }
}
