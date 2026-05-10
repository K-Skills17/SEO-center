import { google } from 'googleapis';
import { db } from '@/lib/db';
import { sites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(siteId: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/indexing',
    ],
    state: siteId,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getAuthenticatedClient(site: {
  id: string;
  gscAccessToken: string | null;
  gscRefreshToken: string | null;
  gscTokenExpiry: Date | null;
}) {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: site.gscAccessToken,
    refresh_token: site.gscRefreshToken,
    expiry_date: site.gscTokenExpiry?.getTime(),
  });

  client.on('tokens', async (tokens) => {
    const updates: Record<string, unknown> = {};
    if (tokens.access_token) updates.gscAccessToken = tokens.access_token;
    if (tokens.refresh_token) updates.gscRefreshToken = tokens.refresh_token;
    if (tokens.expiry_date)
      updates.gscTokenExpiry = new Date(tokens.expiry_date);

    if (Object.keys(updates).length > 0) {
      await db.update(sites).set(updates).where(eq(sites.id, site.id));
    }
  });

  return client;
}
