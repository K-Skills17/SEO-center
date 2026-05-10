import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { issues, sites, crawlData, aiInsights } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateIssueFix } from '@/lib/ai';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; issueId: string }> }
) {
  const { id, issueId } = await params;

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, id),
  });
  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const issue = await db.query.issues.findFirst({
    where: eq(issues.id, issueId),
  });
  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  // Get crawl data for the affected URL
  let pageCrawl = null;
  if (issue.affectedUrl) {
    const crawls = await db.query.crawlData.findMany({
      where: eq(crawlData.siteId, id),
    });
    pageCrawl = crawls.find((c) => c.url === issue.affectedUrl) || null;
  }

  const result = await generateIssueFix({
    issue: {
      title: issue.title,
      description: issue.description,
      issueType: issue.issueType,
      affectedUrl: issue.affectedUrl,
      affectedQuery: issue.affectedQuery,
    },
    crawlData: pageCrawl
      ? {
          title: pageCrawl.title,
          titleLength: pageCrawl.titleLength ?? 0,
          metaDescription: pageCrawl.metaDescription,
          metaDescriptionLength: pageCrawl.metaDescriptionLength ?? 0,
          h1s: pageCrawl.h1 ?? [],
        }
      : undefined,
    siteName: site.name,
  });

  // Save AI insight
  const [insight] = await db
    .insert(aiInsights)
    .values({
      siteId: id,
      insightType: 'issue_fix',
      relatedIssueId: issueId,
      relatedUrl: issue.affectedUrl,
      relatedQuery: issue.affectedQuery,
      content: result.content,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    })
    .returning();

  return NextResponse.json(insight);
}
