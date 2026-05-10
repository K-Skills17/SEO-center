import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gscMetrics } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { format, subDays } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const period = request.nextUrl.searchParams.get('period') || '28d';

  const days = parseInt(period.replace('d', '')) || 28;
  const startDate = format(subDays(new Date(), days + 3), 'yyyy-MM-dd');

  const data = await db
    .select({
      date: gscMetrics.date,
      clicks: sql<number>`SUM(${gscMetrics.clicks})::int`,
      impressions: sql<number>`SUM(${gscMetrics.impressions})::int`,
      avgCtr: sql<number>`AVG(${gscMetrics.ctr})::float`,
      avgPosition: sql<number>`AVG(${gscMetrics.position})::float`,
    })
    .from(gscMetrics)
    .where(and(eq(gscMetrics.siteId, id), gte(gscMetrics.date, startDate)))
    .groupBy(gscMetrics.date)
    .orderBy(gscMetrics.date);

  // Calculate totals for current period
  const totalClicks = data.reduce((sum, d) => sum + (d.clicks || 0), 0);
  const totalImpressions = data.reduce(
    (sum, d) => sum + (d.impressions || 0),
    0
  );
  const avgCtr =
    data.length > 0
      ? data.reduce((sum, d) => sum + (d.avgCtr || 0), 0) / data.length
      : 0;
  const avgPosition =
    data.length > 0
      ? data.reduce((sum, d) => sum + (d.avgPosition || 0), 0) / data.length
      : 0;

  // Device breakdown
  const deviceData = await db
    .select({
      device: gscMetrics.device,
      clicks: sql<number>`SUM(${gscMetrics.clicks})::int`,
      impressions: sql<number>`SUM(${gscMetrics.impressions})::int`,
    })
    .from(gscMetrics)
    .where(and(eq(gscMetrics.siteId, id), gte(gscMetrics.date, startDate)))
    .groupBy(gscMetrics.device);

  // Country breakdown
  const countryData = await db
    .select({
      country: gscMetrics.country,
      clicks: sql<number>`SUM(${gscMetrics.clicks})::int`,
      impressions: sql<number>`SUM(${gscMetrics.impressions})::int`,
    })
    .from(gscMetrics)
    .where(and(eq(gscMetrics.siteId, id), gte(gscMetrics.date, startDate)))
    .groupBy(gscMetrics.country)
    .orderBy(sql`SUM(${gscMetrics.clicks}) DESC`)
    .limit(10);

  return NextResponse.json({
    timeSeries: data,
    totals: { totalClicks, totalImpressions, avgCtr, avgPosition },
    deviceBreakdown: deviceData,
    countryBreakdown: countryData,
  });
}
