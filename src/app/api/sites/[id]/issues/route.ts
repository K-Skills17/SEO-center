import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { issues } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const severity = request.nextUrl.searchParams.get('severity');
  const category = request.nextUrl.searchParams.get('category');
  const status = request.nextUrl.searchParams.get('status') || 'open';

  const conditions = [eq(issues.siteId, id)];
  if (severity) conditions.push(eq(issues.severity, severity));
  if (category) conditions.push(eq(issues.category, category));
  if (status !== 'all') conditions.push(eq(issues.status, status));

  const data = await db
    .select()
    .from(issues)
    .where(and(...conditions))
    .orderBy(desc(issues.createdAt));

  return NextResponse.json(data);
}
