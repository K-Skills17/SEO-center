const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export interface PageSpeedResult {
  url: string;
  performanceScore: number;
  lcpMs: number;
  clsScore: number;
  fidMs: number;
  ttfbMs: number;
  strategy: 'mobile' | 'desktop';
}

export async function fetchPageSpeed(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PageSpeedResult> {
  const params = new URLSearchParams({
    url,
    strategy,
    key: process.env.GOOGLE_PAGESPEED_API_KEY || '',
    category: 'performance',
  });

  const res = await fetch(`${PSI_API}?${params}`);
  const data = await res.json();

  const categories = data.lighthouseResult?.categories;
  const audits = data.lighthouseResult?.audits;

  return {
    url,
    strategy,
    performanceScore: Math.round(
      (categories?.performance?.score || 0) * 100
    ),
    lcpMs: Math.round(
      audits?.['largest-contentful-paint']?.numericValue || 0
    ),
    clsScore: audits?.['cumulative-layout-shift']?.numericValue || 0,
    fidMs: Math.round(audits?.['max-potential-fid']?.numericValue || 0),
    ttfbMs: Math.round(
      audits?.['server-response-time']?.numericValue || 0
    ),
  };
}
