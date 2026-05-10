import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { issues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; issueId: string }> }
) {
  const { issueId } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.status) {
    updates.status = body.status;
    if (body.status === 'resolved') {
      updates.resolvedAt = new Date();
    }
  }
  if (body.isNew !== undefined) {
    updates.isNew = body.isNew;
  }

  const [updated] = await db
    .update(issues)
    .set(updates)
    .where(eq(issues.id, issueId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
