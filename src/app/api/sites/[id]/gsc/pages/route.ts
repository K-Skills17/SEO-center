import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gscMetrics, crawlData } from '@/lib/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { format, subDays } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sort = request.nextUrl.searchParams.get('sort') || 'clicks';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

  const startDate = format(subDays(new Date(), 31), 'yyyy-MM-dd');

  // GSC performance per page
  const gscPages = await db
    .select({
      pageUrl: gscMetrics.pageUrl,
      clicks: sql<number>`SUM(${gscMetrics.clicks})::int`,
      impressions: sql<number>`SUM(${gscMetrics.impressions})::int`,
      avgCtr: sql<number>`AVG(${gscMetrics.ctr})::float`,
      avgPosition: sql<number>`AVG(${gscMetrics.position})::float`,
    })
    .from(gscMetrics)
    .where(and(eq(gscMetrics.siteId, id), gte(gscMetrics.date, startDate)))
    .groupBy(gscMetrics.pageUrl)
    .orderBy(
      sort === 'impressions'
        ? desc(sql`SUM(${gscMetrics.impressions})`)
        : desc(sql`SUM(${gscMetrics.clicks})`)
    )
    .limit(limit);

  // Crawl data for those pages
  const crawlResults = await db.query.crawlData.findMany({
    where: eq(crawlData.siteId, id),
  });

  const crawlMap = new Map(crawlResults.map((c) => [c.url, c]));

  const pages = gscPages.map((page) => {
    const crawl = crawlMap.get(page.pageUrl);
    return {
      ...page,
      title: crawl?.title || null,
      onPageScore: crawl?.onPageScore || null,
      technicalScore: crawl?.technicalScore || null,
      performanceScore: crawl?.performanceScore || null,
      lcpMs: crawl?.lcpMs || null,
      clsScore: crawl?.clsScore || null,
      lastCrawled: crawl?.crawledAt || null,
    };
  });

  return NextResponse.json(pages);
}
