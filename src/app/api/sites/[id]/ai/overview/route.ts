import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sites, issues, gscMetrics, aiInsights } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { format, subDays } from 'date-fns';
import { generateSiteOverview } from '@/lib/ai';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, id),
  });
  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  // Get top issues
  const topIssues = await db
    .select()
    .from(issues)
    .where(and(eq(issues.siteId, id), eq(issues.status, 'open')))
    .orderBy(
      sql`CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END`
    )
    .limit(10);

  const criticalCount = topIssues.filter(
    (i) => i.severity === 'critical'
  ).length;

  // Get top keywords
  const startDate = format(subDays(new Date(), 31), 'yyyy-MM-dd');
  const topKeywords = await db
    .select({
      query: gscMetrics.query,
      avgPosition: sql<number>`AVG(${gscMetrics.position})::float`,
      clicks: sql<number>`SUM(${gscMetrics.clicks})::int`,
      impressions: sql<number>`SUM(${gscMetrics.impressions})::int`,
    })
    .from(gscMetrics)
    .where(and(eq(gscMetrics.siteId, id), gte(gscMetrics.date, startDate)))
    .groupBy(gscMetrics.query)
    .orderBy(desc(sql`SUM(${gscMetrics.impressions})`))
    .limit(10);

  // Get top pages
  const topPages = await db
    .select({
      pageUrl: gscMetrics.pageUrl,
      clicks: sql<number>`SUM(${gscMetrics.clicks})::int`,
      avgCtr: sql<number>`AVG(${gscMetrics.ctr})::float`,
    })
    .from(gscMetrics)
    .where(and(eq(gscMetrics.siteId, id), gte(gscMetrics.date, startDate)))
    .groupBy(gscMetrics.pageUrl)
    .orderBy(desc(sql`SUM(${gscMetrics.clicks})`))
    .limit(10);

  const result = await generateSiteOverview({
    siteName: site.name,
    domain: site.domain,
    healthScore: site.healthScore || 0,
    totalIssues: topIssues.length,
    criticalIssues: criticalCount,
    topIssues: topIssues.map((i) => ({
      title: i.title,
      category: i.category,
      severity: i.severity,
      affectedUrl: i.affectedUrl ?? undefined,
    })),
    topKeywords: topKeywords.map((k) => ({
      query: k.query,
      position: k.avgPosition,
      clicks: k.clicks,
      impressions: k.impressions,
    })),
    topPages: topPages.map((p) => ({
      url: p.pageUrl,
      clicks: p.clicks,
      ctr: p.avgCtr,
    })),
  });

  // Save insight
  const [insight] = await db
    .insert(aiInsights)
    .values({
      siteId: id,
      insightType: 'site_overview',
      content: result.content,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    })
    .returning();

  return NextResponse.json(insight);
}
