import { createHash } from 'crypto';
import type { CrawlResult } from '@/lib/crawler';
import type { GSCRow } from '@/lib/gsc/fetcher';

// ─── SCORING WEIGHTS ────────────────────────────────────────
const ON_PAGE_WEIGHTS = {
  title: 20,
  metaDesc: 20,
  h1: 15,
  canonical: 10,
  ogTags: 10,
  jsonLd: 15,
  altText: 10,
};

// ─── ISSUE INPUT TYPE ────────────────────────────────────────
export interface IssueInput {
  category: string;
  severity: 'critical' | 'warning' | 'opportunity';
  issue_type: string;
  affected_url?: string;
  affected_query?: string;
  title: string;
  description: string;
  impact: string;
  fix_snippet?: string;
  fingerprint: string;
}

// ─── EXPECTED CTR BY POSITION ────────────────────────────────
function expectedCTR(position: number): string {
  const ctrs: Record<number, string> = {
    1: '28.5', 2: '15.7', 3: '11.0', 4: '8.0', 5: '7.2',
    6: '5.1', 7: '4.0', 8: '3.2', 9: '2.8', 10: '2.5',
  };
  return ctrs[Math.round(position)] || '1.5';
}

// ─── ISSUE DEFINITIONS ──────────────────────────────────────
interface IssueDef {
  category: string;
  severity: 'critical' | 'warning' | 'opportunity';
  title: string;
  description: (data: Record<string, unknown>) => string;
  impact: string;
  fix: (data: Record<string, unknown>) => string;
}

export const ISSUE_DEFINITIONS: Record<string, IssueDef> = {
  missing_title: {
    category: 'on_page',
    severity: 'critical',
    title: 'Missing Page Title',
    description: () =>
      'This page has no <title> tag. Google uses the title as the primary search result headline.',
    impact:
      'Severely reduces click-through rate and prevents Google from categorizing the page correctly.',
    fix: () =>
      `// In your Next.js page or layout:\nexport const metadata = {\n  title: 'Your Page Title | Site Name',\n};`,
  },
  title_too_short: {
    category: 'on_page',
    severity: 'warning',
    title: 'Title Too Short',
    description: (d) =>
      `Title is ${d.titleLength} characters. Optimal range is 50-60 characters.`,
    impact: 'Short titles miss keyword opportunities and look incomplete in SERPs.',
    fix: () =>
      `export const metadata = {\n  title: 'Expanded, Descriptive Page Title | Brand',\n};`,
  },
  title_too_long: {
    category: 'on_page',
    severity: 'warning',
    title: 'Title Too Long (Will Be Truncated)',
    description: (d) =>
      `Title is ${d.titleLength} characters. Google truncates above ~60 characters.`,
    impact: 'Truncated titles in SERPs reduce click-through rates.',
    fix: () =>
      `// Shorten your title to under 60 characters:\nexport const metadata = {\n  title: 'Concise Title | Brand',\n};`,
  },
  missing_meta_description: {
    category: 'on_page',
    severity: 'critical',
    title: 'Missing Meta Description',
    description: () =>
      'No meta description found. Google may auto-generate one from page content, often poorly.',
    impact: 'Missing descriptions reduce organic CTR by an estimated 5.8% on average.',
    fix: () =>
      `export const metadata = {\n  description: 'Compelling 120-158 character description that includes your primary keyword and a clear value proposition.',\n};`,
  },
  meta_description_too_long: {
    category: 'on_page',
    severity: 'warning',
    title: 'Meta Description Too Long',
    description: (d) =>
      `Meta description is ${d.metaDescriptionLength} characters. Google truncates above 158 characters.`,
    impact: 'Truncated descriptions break the call-to-action and reduce CTR.',
    fix: () => `// Keep meta descriptions between 120-158 characters`,
  },
  missing_h1: {
    category: 'on_page',
    severity: 'critical',
    title: 'Missing H1 Tag',
    description: () => 'No H1 heading found on this page.',
    impact: 'H1 is a strong on-page relevance signal. Missing it weakens topical authority.',
    fix: () =>
      `// Add exactly one H1 to your page:\n<h1>Your Primary Keyword-Rich Heading</h1>`,
  },
  multiple_h1: {
    category: 'on_page',
    severity: 'warning',
    title: 'Multiple H1 Tags',
    description: (d) => {
      const h1s = d.h1s as string[];
      return `Found ${h1s.length} H1 tags. Only one H1 per page is recommended.`;
    },
    impact: 'Multiple H1s dilute the primary topic signal for Google.',
    fix: () =>
      `// Convert extra H1s to H2s:\n// Keep only one: <h1>Primary Topic</h1>\n// Others: <h2>Secondary Topic</h2>`,
  },
  missing_canonical: {
    category: 'technical',
    severity: 'warning',
    title: 'Missing Canonical Tag',
    description: () =>
      'No canonical link element found. This can cause duplicate content issues.',
    impact:
      'Without canonicals, Google may index the wrong URL variant (with/without trailing slash, http/https, www/non-www).',
    fix: () =>
      `// In Next.js App Router layout.tsx or page.tsx:\nexport const metadata = {\n  alternates: {\n    canonical: 'https://yourdomain.com/this-page',\n  },\n};`,
  },
  missing_og_tags: {
    category: 'on_page',
    severity: 'warning',
    title: 'Missing Open Graph Tags',
    description: () =>
      'og:title, og:description, or og:image is missing.',
    impact: 'Social shares will use poor or auto-generated previews, reducing social traffic.',
    fix: () =>
      `export const metadata = {\n  openGraph: {\n    title: 'Your Title',\n    description: 'Your Description',\n    images: [{ url: 'https://yourdomain.com/og-image.jpg' }],\n  },\n};`,
  },
  missing_json_ld: {
    category: 'on_page',
    severity: 'opportunity',
    title: 'No Structured Data (JSON-LD)',
    description: () =>
      'No JSON-LD structured data found. Structured data enables rich results in Google.',
    impact: 'Pages with structured data get rich snippets which can increase CTR by 20-30%.',
    fix: () =>
      `// Add JSON-LD to your page:\n<script\n  type="application/ld+json"\n  dangerouslySetInnerHTML={{ __html: JSON.stringify({\n    '@context': 'https://schema.org',\n    '@type': 'WebPage',\n    name: 'Your Page Name',\n  }) }}\n/>`,
  },
  images_missing_alt: {
    category: 'on_page',
    severity: 'warning',
    title: 'Images Without Alt Text',
    description: (d) =>
      `${d.imagesWithoutAlt} of ${d.totalImages} images are missing alt attributes.`,
    impact: 'Missing alt text loses image search traffic and fails accessibility standards.',
    fix: () =>
      `// Add descriptive alt text to all images:\n<Image src="/photo.jpg" alt="Descriptive text about the image" />`,
  },
  blocked_by_robots: {
    category: 'technical',
    severity: 'critical',
    title: 'Page Blocked From Indexing',
    description: () =>
      'robots meta tag contains "noindex". Google will not index this page.',
    impact: 'Critical — this page will not appear in Google search results.',
    fix: () =>
      `// Remove noindex or change to:\nexport const metadata = {\n  robots: 'index, follow',\n};`,
  },
  poor_performance: {
    category: 'performance',
    severity: 'critical',
    title: 'Poor Core Web Vitals Score',
    description: (d) =>
      `PageSpeed score is ${d.performanceScore}/100 on mobile. LCP: ${d.lcpMs}ms, CLS: ${d.clsScore}.`,
    impact: 'Google uses Core Web Vitals as a ranking signal. Poor scores hurt rankings on mobile searches.',
    fix: () =>
      `// Next.js performance checklist:\n// 1. Use next/image for all images\n// 2. Use next/font for web fonts\n// 3. Enable ISR or SSG where possible\n// 4. Audit third-party scripts`,
  },
  slow_ttfb: {
    category: 'performance',
    severity: 'warning',
    title: 'Slow Server Response Time (TTFB)',
    description: (d) =>
      `Time to First Byte is ${d.ttfbMs}ms. Target is under 600ms.`,
    impact: 'Slow TTFB delays all other loading metrics and signals poor server infrastructure.',
    fix: () =>
      `// Next.js TTFB improvements:\n// 1. Enable ISR: export const revalidate = 3600;\n// 2. Move to edge runtime for dynamic routes\n// 3. Add Redis caching for database queries`,
  },
  low_ctr: {
    category: 'content',
    severity: 'opportunity',
    title: 'High Impressions, Low CTR',
    description: (d) =>
      `"${d.query}" gets ${d.impressions} impressions at position ${d.position} but only ${((d.ctr as number) * 100).toFixed(1)}% CTR. Expected CTR at this position is ~${expectedCTR(d.position as number)}%.`,
    impact: 'Improving title/description for this query could unlock significant traffic without any ranking improvement.',
    fix: () =>
      `// Rewrite the title and meta description to be more click-worthy:\n// - Include the exact search query\n// - Add a number, year, or power word\n// - Add a clear benefit or outcome`,
  },
  striking_distance: {
    category: 'content',
    severity: 'opportunity',
    title: 'Keyword in Striking Distance (Position 8-20)',
    description: (d) =>
      `"${d.query}" is ranking at position ${d.position} with ${d.impressions} impressions. A small push could reach page 1.`,
    impact: 'Positions 1-3 get 3-10x more clicks than position 8-20. This is a high-leverage optimization target.',
    fix: () =>
      `// To improve ranking for this keyword:\n// 1. Add the keyword to the H1 and first paragraph\n// 2. Create supporting internal links from other pages\n// 3. Expand content depth on this page\n// 4. Add FAQ schema targeting this query`,
  },
  cannibalization: {
    category: 'cannibalization',
    severity: 'warning',
    title: 'Keyword Cannibalization Detected',
    description: (d) => {
      const urls = d.urls as { url: string }[];
      return `"${d.query}" is split across ${urls?.length} pages. Google is confused about which to rank.`;
    },
    impact: 'Cannibalized keywords result in both pages ranking lower than one consolidated page would.',
    fix: () =>
      `// Cannibalization fix options:\n// 1. Consolidate: Merge weaker page into stronger, 301 redirect\n// 2. Differentiate: Ensure each page targets a distinctly different intent\n// 3. Canonicalize: Point the weaker page's canonical to the stronger page`,
  },
};

// ─── SCORING FUNCTIONS ───────────────────────────────────────

export function scoreOnPage(crawl: CrawlResult): number {
  let score = 0;

  if (crawl.title) {
    if (crawl.titleLength >= 50 && crawl.titleLength <= 60)
      score += ON_PAGE_WEIGHTS.title;
    else score += ON_PAGE_WEIGHTS.title * 0.6;
  }

  if (crawl.metaDescription) {
    if (
      crawl.metaDescriptionLength >= 120 &&
      crawl.metaDescriptionLength <= 158
    )
      score += ON_PAGE_WEIGHTS.metaDesc;
    else score += ON_PAGE_WEIGHTS.metaDesc * 0.6;
  }

  if (crawl.h1s.length === 1) score += ON_PAGE_WEIGHTS.h1;
  else if (crawl.h1s.length > 1) score += ON_PAGE_WEIGHTS.h1 * 0.4;

  if (crawl.canonicalUrl) score += ON_PAGE_WEIGHTS.canonical;

  const hasAllOG = crawl.ogTitle && crawl.ogDescription && crawl.ogImage;
  if (hasAllOG) score += ON_PAGE_WEIGHTS.ogTags;
  else if (crawl.ogTitle || crawl.ogDescription)
    score += ON_PAGE_WEIGHTS.ogTags * 0.5;

  if (crawl.hasJsonLd) score += ON_PAGE_WEIGHTS.jsonLd;

  if (crawl.totalImages === 0 || crawl.imagesWithoutAlt === 0) {
    score += ON_PAGE_WEIGHTS.altText;
  } else {
    const ratio = 1 - crawl.imagesWithoutAlt / crawl.totalImages;
    score += Math.round(ON_PAGE_WEIGHTS.altText * ratio);
  }

  return Math.min(100, score);
}

export function detectIssues(
  crawl: CrawlResult,
  gscData?: GSCRow[]
): IssueInput[] {
  const issues: IssueInput[] = [];

  const add = (
    type: string,
    data?: Record<string, unknown>,
    affectedUrl?: string,
    affectedQuery?: string
  ) => {
    const def = ISSUE_DEFINITIONS[type];
    if (!def) return;
    const inputData = data || (crawl as unknown as Record<string, unknown>);
    issues.push({
      category: def.category,
      severity: def.severity,
      issue_type: type,
      affected_url: affectedUrl || crawl.url,
      affected_query: affectedQuery,
      title: def.title,
      description: def.description(inputData),
      impact: def.impact,
      fix_snippet: def.fix(inputData),
      fingerprint: createHash('md5')
        .update(`${crawl.url}:${type}:${affectedQuery || ''}`)
        .digest('hex'),
    });
  };

  // On-page checks
  if (!crawl.title) add('missing_title');
  else if (crawl.titleLength < 30) add('title_too_short');
  else if (crawl.titleLength > 65) add('title_too_long');

  if (!crawl.metaDescription) add('missing_meta_description');
  else if (crawl.metaDescriptionLength > 160) add('meta_description_too_long');

  if (crawl.h1s.length === 0) add('missing_h1');
  else if (crawl.h1s.length > 1) add('multiple_h1');

  if (!crawl.canonicalUrl) add('missing_canonical');

  const hasAllOG = crawl.ogTitle && crawl.ogDescription && crawl.ogImage;
  if (!hasAllOG) add('missing_og_tags');

  if (!crawl.hasJsonLd) add('missing_json_ld');

  if (crawl.totalImages > 0 && crawl.imagesWithoutAlt > 0) {
    add('images_missing_alt', crawl as unknown as Record<string, unknown>);
  }

  // Technical checks
  if (crawl.robotsMeta?.toLowerCase().includes('noindex')) {
    add('blocked_by_robots');
  }

  if (
    crawl.performanceScore !== undefined &&
    crawl.performanceScore !== null &&
    crawl.performanceScore < 50
  ) {
    add('poor_performance', crawl as unknown as Record<string, unknown>);
  }

  if (
    crawl.ttfbMs !== undefined &&
    crawl.ttfbMs !== null &&
    crawl.ttfbMs > 1500
  ) {
    add('slow_ttfb', crawl as unknown as Record<string, unknown>);
  }

  // GSC-based checks
  if (gscData) {
    gscData.forEach((row) => {
      if (row.position >= 8 && row.position <= 20 && row.impressions >= 100) {
        add(
          'striking_distance',
          row as unknown as Record<string, unknown>,
          row.page,
          row.query
        );
      }

      const expected = parseFloat(expectedCTR(row.position));
      if (row.impressions >= 500 && row.ctr * 100 < expected * 0.5) {
        add(
          'low_ctr',
          row as unknown as Record<string, unknown>,
          row.page,
          row.query
        );
      }
    });
  }

  return issues;
}

export function detectCannibalization(gscRows: GSCRow[]): IssueInput[] {
  const queryToPages: Record<
    string,
    { url: string; impressions: number; position: number }[]
  > = {};

  gscRows.forEach((row) => {
    if (!queryToPages[row.query]) queryToPages[row.query] = [];
    const existing = queryToPages[row.query].find((p) => p.url === row.page);
    if (existing) {
      existing.impressions += row.impressions;
    } else {
      queryToPages[row.query].push({
        url: row.page,
        impressions: row.impressions,
        position: row.position,
      });
    }
  });

  const issues: IssueInput[] = [];

  Object.entries(queryToPages).forEach(([query, pages]) => {
    const significantPages = pages.filter((p) => p.impressions >= 50);
    if (significantPages.length < 2) return;

    const def = ISSUE_DEFINITIONS['cannibalization'];
    issues.push({
      category: def.category,
      severity: def.severity,
      issue_type: 'cannibalization',
      affected_url: significantPages[0].url,
      affected_query: query,
      title: def.title,
      description: def.description({
        query,
        urls: significantPages,
      }),
      impact: def.impact,
      fix_snippet: def.fix({}),
      fingerprint: createHash('md5')
        .update(`cannibalization:${query}`)
        .digest('hex'),
    });
  });

  return issues;
}
