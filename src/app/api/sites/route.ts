import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sites } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const allSites = await db
    .select()
    .from(sites)
    .orderBy(desc(sites.createdAt));

  return NextResponse.json(allSites);
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
