import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sites } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allSites = await db
      .select()
      .from(sites)
      .orderBy(desc(sites.createdAt));

    return NextResponse.json(allSites);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/sites error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { name, domain, gscPropertyUrl, sitemapUrl } = body;

  if (!name || !domain || !gscPropertyUrl) {
    return NextResponse.json(
      { error: 'name, domain, and gscPropertyUrl are required' },
      { status: 400 }
    );
  }

  const [site] = await db
    .insert(sites)
    .values({
      name,
      domain,
      gscPropertyUrl,
      sitemapUrl: sitemapUrl || null,
    })
    .returning();

  return NextResponse.json(site, { status: 201 });
}
