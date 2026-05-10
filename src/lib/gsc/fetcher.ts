import { google } from 'googleapis';
import { getAuthenticatedClient } from './oauth';

export interface GSCRow {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date?: string;
  country?: string;
  device?: string;
}

export interface SiteRecord {
  id: string;
  gscPropertyUrl: string;
  gscAccessToken: string | null;
  gscRefreshToken: string | null;
  gscTokenExpiry: Date | null;
}

const GSC_MAX_ROWS = 25000;

export async function fetchSearchAnalytics(
  site: SiteRecord,
  startDate: string,
  endDate: string,
  dimensions: string[] = ['page', 'query', 'date']
): Promise<GSCRow[]> {
  const auth = await getAuthenticatedClient(site);
  const webmasters = google.webmasters({ version: 'v3', auth });

  const allRows: GSCRow[] = [];
  let startRow = 0;

  while (true) {
    const response = await webmasters.searchanalytics.query({
      siteUrl: site.gscPropertyUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit: GSC_MAX_ROWS,
        startRow,
        dataState: 'all',
      },
    });

    const rows = response.data.rows || [];
    if (rows.length === 0) break;

    rows.forEach((row) => {
      const keys = row.keys || [];
      allRows.push({
        page: keys[dimensions.indexOf('page')] || '',
        query: keys[dimensions.indexOf('query')] || '',
        date: keys[dimensions.indexOf('date')],
        country: keys[dimensions.indexOf('country')],
        device: keys[dimensions.indexOf('device')],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      });
    });

    if (rows.length < GSC_MAX_ROWS) break;
    startRow += GSC_MAX_ROWS;

    // Rate limit: 500ms between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return allRows;
}

export async function inspectUrl(site: SiteRecord, url: string) {
  const auth = await getAuthenticatedClient(site);
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const response = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: url,
      siteUrl: site.gscPropertyUrl,
    },
  });

  return response.data.inspectionResult;
}

export async function fetchSitemaps(site: SiteRecord) {
  const auth = await getAuthenticatedClient(site);
  const webmasters = google.webmasters({ version: 'v3', auth });

  const response = await webmasters.sitemaps.list({
    siteUrl: site.gscPropertyUrl,
  });

  return response.data.sitemap || [];
}
