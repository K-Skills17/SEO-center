import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gscMetrics } from '@/lib/db/schema';
import { eq, and, gte, sql, desc, asc } from 'drizzle-orm';
import { format, subDays } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sort = request.nextUrl.searchParams.get('sort') || 'impressions';
  const limit = parseInt(
    request.nextUrl.searchParams.get('limit') || '100'
  );
  const offset = parseInt(
    request.nextUrl.searchParams.get('offset') || '0'
  );
  const search = request.nextUrl.searchParams.get('search') || '';
  const positionFilter =
    request.nextUrl.searchParams.get('position') || 'all';

  const startDate = format(subDays(new Date(), 31), 'yyyy-MM-dd');

  let query = db
    .select({
      query: gscMetrics.query,
      pageUrl: gscMetrics.pageUrl,
      clicks: sql<number>`SUM(${gscMetrics.clicks})::int`,
      impressions: sql<number>`SUM(${gscMetrics.impressions})::int`,
      avgCtr: sql<number>`AVG(${gscMetrics.ctr})::float`,
      avgPosition: sql<number>`AVG(${gscMetrics.position})::float`,
    })
    .from(gscMetrics)
    .where(
      and(
        eq(gscMetrics.siteId, id),
        gte(gscMetrics.date, startDate),
        search
          ? sql`${gscMetrics.query} ILIKE ${'%' + search + '%'}`
          : undefined
      )
    )
    .groupBy(gscMetrics.query, gscMetrics.pageUrl)
    .limit(limit)
    .offset(offset);

  // Apply sort
  const sortColumn =
    sort === 'clicks'
      ? sql`SUM(${gscMetrics.clicks})`
      : sort === 'ctr'
        ? sql`AVG(${gscMetrics.ctr})`
        : sort === 'position'
          ? sql`AVG(${gscMetrics.position})`
          : sql`SUM(${gscMetrics.impressions})`;

  const sortDir = sort === 'position' ? asc(sortColumn) : desc(sortColumn);
  query = query.orderBy(sortDir) as typeof query;

  const data = await query;

  // Filter by position range client-side for simplicity
  let filtered = data;
  if (positionFilter === 'top3') {
    filtered = data.filter((d) => d.avgPosition <= 3);
  } else if (positionFilter === '4-10') {
    filtered = data.filter(
      (d) => d.avgPosition > 3 && d.avgPosition <= 10
    );
  } else if (positionFilter === 'striking') {
    filtered = data.filter(
      (d) => d.avgPosition >= 8 && d.avgPosition <= 20
    );
  } else if (positionFilter === 'page2+') {
    filtered = data.filter((d) => d.avgPosition > 10);
  }

  return NextResponse.json(filtered);
}
