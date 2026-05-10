import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  sites,
  gscMetrics,
  crawlData,
  issues,
  keywordPositions,
} from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { format, subDays } from 'date-fns';
import { fetchSearchAnalytics } from '@/lib/gsc/fetcher';
import { crawlUrl, parseSitemap } from '@/lib/crawler';
import { fetchPageSpeed } from '@/lib/pagespeed';
import {
  scoreOnPage,
  detectIssues,
  detectCannibalization,
} from '@/lib/scoring';
import type { CrawlResult } from '@/lib/crawler';

async function upsertIssues(siteId: string, issueInputs: ReturnType<typeof detectIssues>) {
  for (const issue of issueInputs) {
    await db
      .insert(issues)
      .values({
        siteId,
        category: issue.category,
        severity: issue.severity,
        issueType: issue.issue_type,
        affectedUrl: issue.affected_url,
        affectedQuery: issue.affected_query,
        title: issue.title,
        description: issue.description,
        impact: issue.impact,
        fixSnippet: issue.fix_snippet,
        fingerprint: issue.fingerprint,
      })
      .onConflictDoUpdate({
        target: issues.fingerprint,
        set: {
          description: issue.description,
          impact: issue.impact,
          fixSnippet: issue.fix_snippet,
          severity: issue.severity,
        },
      });
  }
}

async function runFullSync(siteId: string) {
  await db
    .update(sites)
    .set({ syncStatus: 'syncing', syncError: null })
    .where(eq(sites.id, siteId));

  try {
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, siteId),
    });
    if (!site) throw new Error('Site not found');

    // 1. GSC data sync (90 days, ending 3 days ago for data freshness)
    const endDate = format(subDays(new Date(), 3), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), 93), 'yyyy-MM-dd');

    let gscRows: Awaited<ReturnType<typeof fetchSearchAnalytics>> = [];

    if (site.gscAccessToken && site.gscRefreshToken) {
      gscRows = await fetchSearchAnalytics(
        {
          id: site.id,
          gscPropertyUrl: site.gscPropertyUrl,
          gscAccessToken: site.gscAccessToken,
          gscRefreshToken: site.gscRefreshToken,
          gscTokenExpiry: site.gscTokenExpiry,
        },
        startDate,
        endDate
      );

      // Batch upsert GSC metrics
      for (const row of gscRows) {
        await db
          .insert(gscMetrics)
          .values({
            siteId,
            date: row.date || endDate,
            pageUrl: row.page,
            query: row.query,
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: String(row.ctr),
            position: String(row.position),
            country: row.country,
            device: row.device,
          })
          .onConflictDoNothing();
      }

      // Save keyword positions snapshot
      const today = format(new Date(), 'yyyy-MM-dd');
      const queryAggregates: Record<
        string,
        {
          page: string;
          position: number;
          impressions: number;
          clicks: number;
        }
      > = {};
      for (const row of gscRows) {
        const key = `${row.query}::${row.page}`;
        if (!queryAggregates[key]) {
          queryAggregates[key] = {
            page: row.page,
            position: row.position,
            impressions: 0,
            clicks: 0,
          };
        }
        queryAggregates[key].impressions += row.impressions;
        queryAggregates[key].clicks += row.clicks;
      }

      for (const [key, agg] of Object.entries(queryAggregates)) {
        const query = key.split('::')[0];
        await db
          .insert(keywordPositions)
          .values({
            siteId,
            recordedAt: today,
            query,
            pageUrl: agg.page,
            position: String(agg.position),
            impressions: agg.impressions,
            clicks: agg.clicks,
          })
          .onConflictDoNothing();
      }
    }

    // 2. Crawl sitemap URLs
    const sitemapUrl =
      site.sitemapUrl || `https://${site.domain}/sitemap.xml`;
    let urls: string[] = [];
    try {
      urls = await parseSitemap(sitemapUrl);
    } catch {
      // Try fallback
      try {
        urls = await parseSitemap(
          `https://${site.domain}/sitemap_index.xml`
        );
      } catch {
        console.warn(`Could not parse sitemap for ${site.domain}`);
      }
    }

    // Get top pages by GSC impressions for PageSpeed
    const pageImpressions: Record<string, number> = {};
    gscRows.forEach((row) => {
      pageImpressions[row.page] =
        (pageImpressions[row.page] || 0) + row.impressions;
    });
    const topPageUrls = Object.entries(pageImpressions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([url]) => url);

    // Crawl in batches of 10
    for (let i = 0; i < urls.length; i += 10) {
      const batch = urls.slice(i, i + 10);
      const results = await Promise.all(
        batch.map((url) => crawlUrl(url, site.domain))
      );

      for (const crawlResult of results) {
        // Fetch PageSpeed for top pages
        if (topPageUrls.includes(crawlResult.url)) {
          try {
            const psi = await fetchPageSpeed(crawlResult.url, 'mobile');
            (crawlResult as CrawlResult).performanceScore = psi.performanceScore;
            (crawlResult as CrawlResult).lcpMs = psi.lcpMs;
            (crawlResult as CrawlResult).clsScore = psi.clsScore;
            (crawlResult as CrawlResult).ttfbMs = psi.ttfbMs;
          } catch {
            // PageSpeed API may fail, continue
          }
        }

        const onPageScore = scoreOnPage(crawlResult);

        await db
          .insert(crawlData)
          .values({
            siteId,
            url: crawlResult.url,
            httpStatus: crawlResult.httpStatus,
            title: crawlResult.title,
            titleLength: crawlResult.titleLength,
            metaDescription: crawlResult.metaDescription,
            metaDescriptionLength: crawlResult.metaDescriptionLength,
            h1: crawlResult.h1s,
            h2: crawlResult.h2s,
            canonicalUrl: crawlResult.canonicalUrl,
            robotsMeta: crawlResult.robotsMeta,
            ogTitle: crawlResult.ogTitle,
            ogDescription: crawlResult.ogDescription,
            ogImage: crawlResult.ogImage,
            hasJsonLd: crawlResult.hasJsonLd,
            jsonLdTypes: crawlResult.jsonLdTypes,
            imagesWithoutAlt: crawlResult.imagesWithoutAlt,
            totalImages: crawlResult.totalImages,
            internalLinks: crawlResult.internalLinks,
            externalLinks: crawlResult.externalLinks,
            performanceScore: crawlResult.performanceScore ?? null,
            lcpMs: crawlResult.lcpMs ?? null,
            clsScore: crawlResult.clsScore != null ? String(crawlResult.clsScore) : null,
            fidMs: crawlResult.fidMs ?? null,
            ttfbMs: crawlResult.ttfbMs ?? null,
            onPageScore,
            crawledAt: crawlResult.crawledAt,
          })
          .onConflictDoUpdate({
            target: [crawlData.siteId, crawlData.url],
            set: {
              httpStatus: crawlResult.httpStatus,
              title: crawlResult.title,
              titleLength: crawlResult.titleLength,
              metaDescription: crawlResult.metaDescription,
              metaDescriptionLength: crawlResult.metaDescriptionLength,
              h1: crawlResult.h1s,
              h2: crawlResult.h2s,
              canonicalUrl: crawlResult.canonicalUrl,
              robotsMeta: crawlResult.robotsMeta,
              ogTitle: crawlResult.ogTitle,
              ogDescription: crawlResult.ogDescription,
              ogImage: crawlResult.ogImage,
              hasJsonLd: crawlResult.hasJsonLd,
              jsonLdTypes: crawlResult.jsonLdTypes,
              imagesWithoutAlt: crawlResult.imagesWithoutAlt,
              totalImages: crawlResult.totalImages,
              internalLinks: crawlResult.internalLinks,
              externalLinks: crawlResult.externalLinks,
              performanceScore: crawlResult.performanceScore ?? null,
              lcpMs: crawlResult.lcpMs ?? null,
              clsScore: crawlResult.clsScore != null ? String(crawlResult.clsScore) : null,
              fidMs: crawlResult.fidMs ?? null,
              ttfbMs: crawlResult.ttfbMs ?? null,
              onPageScore,
              crawledAt: crawlResult.crawledAt,
            },
          });

        // Detect issues for this URL
        const pageGscData = gscRows.filter((r) => r.page === crawlResult.url);
        const pageIssues = detectIssues(crawlResult, pageGscData);
        await upsertIssues(siteId, pageIssues);
      }

      // Rate limit between batches
      if (i + 10 < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // 3. Cannibalization detection
    if (gscRows.length > 0) {
      const cannibalizationIssues = detectCannibalization(gscRows);
      await upsertIssues(siteId, cannibalizationIssues);
    }

    // 4. Calculate composite health score
    const allCrawl = await db.query.crawlData.findMany({
      where: eq(crawlData.siteId, siteId),
    });

    const avgOnPage =
      allCrawl.length > 0
        ? allCrawl.reduce((sum, p) => sum + (p.onPageScore || 0), 0) /
          allCrawl.length
        : 50;

    const [criticalIssueCount] = await db
      .select({ count: count() })
      .from(issues)
      .where(
        and(
          eq(issues.siteId, siteId),
          eq(issues.severity, 'critical'),
          eq(issues.status, 'open')
        )
      );

    const healthScore = Math.max(
      0,
      Math.round(avgOnPage - criticalIssueCount.count * 5)
    );

    // 5. Mark sync complete
    await db
      .update(sites)
      .set({
        healthScore,
        lastGscSync: new Date(),
        lastCrawlSync: new Date(),
        syncStatus: 'done',
        syncError: null,
        updatedAt: new Date(),
      })
      .where(eq(sites.id, siteId));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await db
      .update(sites)
      .set({
        syncStatus: 'error',
        syncError: message,
        updatedAt: new Date(),
      })
      .where(eq(sites.id, siteId));
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const syncType = request.nextUrl.searchParams.get('type') || 'full';

  try {
    if (syncType === 'full' || syncType === 'gsc' || syncType === 'crawl') {
      // Run sync in background (don't await in production, but for simplicity we await here)
      await runFullSync(id);
    }

    return NextResponse.json({ success: true, syncType });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
