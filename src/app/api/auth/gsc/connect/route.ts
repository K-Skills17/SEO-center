import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gsc/oauth';

export async function GET(request: NextRequest) {
  const siteId = request.nextUrl.searchParams.get('siteId');
  if (!siteId) {
    return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
  }

  const authUrl = getAuthUrl(siteId);
  return NextResponse.redirect(authUrl);
}
