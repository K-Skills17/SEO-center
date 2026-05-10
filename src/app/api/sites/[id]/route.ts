import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sites, issues } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET(
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

  const [issueCounts] = await db
    .select({ count: count() })
    .from(issues)
    .where(and(eq(issues.siteId, id), eq(issues.status, 'open')));

  const [criticalCount] = await db
    .select({ count: count() })
    .from(issues)
    .where(
      and(
        eq(issues.siteId, id),
        eq(issues.status, 'open'),
        eq(issues.severity, 'critical')
      )
    );

  return NextResponse.json({
    ...site,
    openIssues: issueCounts.count,
    criticalIssues: criticalCount.count,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(sites)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(sites.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [deleted] = await db
    .delete(sites)
    .where(eq(sites.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
