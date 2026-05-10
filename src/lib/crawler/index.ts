import * as cheerio from 'cheerio';

export interface CrawlResult {
  url: string;
  httpStatus: number;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1s: string[];
  h2s: string[];
  canonicalUrl: string | null;
  robotsMeta: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  hasJsonLd: boolean;
  jsonLdTypes: string[];
  imagesWithoutAlt: number;
  totalImages: number;
  internalLinks: number;
  externalLinks: number;
  crawledAt: Date;
  performanceScore?: number | null;
  lcpMs?: number | null;
  clsScore?: number | null;
  fidMs?: number | null;
  ttfbMs?: number | null;
}

function createErrorResult(url: string, httpStatus: number): CrawlResult {
  return {
    url,
    httpStatus,
    title: null,
    titleLength: 0,
    metaDescription: null,
    metaDescriptionLength: 0,
    h1s: [],
    h2s: [],
    canonicalUrl: null,
    robotsMeta: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    hasJsonLd: false,
    jsonLdTypes: [],
    imagesWithoutAlt: 0,
    totalImages: 0,
    internalLinks: 0,
    externalLinks: 0,
    crawledAt: new Date(),
  };
}

export async function crawlUrl(
  url: string,
  domain: string
): Promise<CrawlResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html = '';
  let httpStatus = 0;

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SEOCommandCenter/1.0',
      },
    });
    httpStatus = res.status;
    html = await res.text();
  } catch {
    return createErrorResult(url, httpStatus);
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);

  const title = $('title').first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() || null;

  const h1s: string[] = [];
  $('h1').each((_, el) => { h1s.push($(el).text().trim()); });
  const h2s: string[] = [];
  $('h2').each((_, el) => { h2s.push($(el).text().trim()); });

  const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
  const robotsMeta = $('meta[name="robots"]').attr('content') || null;

  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDescription =
    $('meta[property="og:description"]').attr('content') || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;

  const jsonLdTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const types = Array.isArray(data)
        ? data.map((d) => d['@type'])
        : [data['@type']];
      jsonLdTypes.push(...types.filter(Boolean));
    } catch {
      // ignore malformed JSON-LD
    }
  });
  const hasJsonLd = jsonLdTypes.length > 0;

  let imagesWithoutAlt = 0;
  let totalImages = 0;
  $('img').each((_, el) => {
    totalImages++;
    const alt = $(el).attr('alt');
    if (!alt || alt.trim() === '') imagesWithoutAlt++;
  });

  let internalLinks = 0;
  let externalLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes(domain) || href.startsWith('/')) {
      internalLinks++;
    } else if (href.startsWith('http')) {
      externalLinks++;
    }
  });

  return {
    url,
    httpStatus,
    title,
    titleLength: title?.length || 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length || 0,
    h1s,
    h2s,
    canonicalUrl,
    robotsMeta,
    ogTitle,
    ogDescription,
    ogImage,
    hasJsonLd,
    jsonLdTypes,
    imagesWithoutAlt,
    totalImages,
    internalLinks,
    externalLinks,
    crawledAt: new Date(),
  };
}

export async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  const res = await fetch(sitemapUrl);
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const sitemapUrls: string[] = [];
  $('sitemap loc').each((_, el) => { sitemapUrls.push($(el).text().trim()); });

  if (sitemapUrls.length > 0) {
    const nested = await Promise.all(sitemapUrls.map(parseSitemap));
    return nested.flat();
  }

  const urls: string[] = [];
  $('url loc').each((_, el) => { urls.push($(el).text().trim()); });
  return urls;
}
