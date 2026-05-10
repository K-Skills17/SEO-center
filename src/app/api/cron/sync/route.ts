import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeSites = await db
    .select()
    .from(sites)
    .where(eq(sites.isActive, true));

  const results: { siteId: string; name: string; status: string }[] = [];

  for (const site of activeSites) {
    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(
        `${appUrl}/api/sites/${site.id}/sync?type=full`,
        { method: 'POST' }
      );

      if (response.ok) {
        results.push({ siteId: site.id, name: site.name, status: 'success' });
      } else {
        results.push({ siteId: site.id, name: site.name, status: 'failed' });
      }
    } catch (error) {
      results.push({ siteId: site.id, name: site.name, status: 'error' });
    }
  }

  return NextResponse.json({ synced: results.length, results });
}
