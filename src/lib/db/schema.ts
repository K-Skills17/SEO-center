import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  date,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── SITES ────────────────────────────────────────────────────
export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  gscPropertyUrl: text('gsc_property_url').notNull(),
  sitemapUrl: text('sitemap_url'),

  gscAccessToken: text('gsc_access_token'),
  gscRefreshToken: text('gsc_refresh_token'),
  gscTokenExpiry: timestamp('gsc_token_expiry', { withTimezone: true }),

  lastGscSync: timestamp('last_gsc_sync', { withTimezone: true }),
  lastCrawlSync: timestamp('last_crawl_sync', { withTimezone: true }),
  syncStatus: text('sync_status').default('pending'),
  syncError: text('sync_error'),

  healthScore: integer('health_score'),
  isActive: boolean('is_active').default(true),
});

// ─── GSC METRICS ──────────────────────────────────────────────
export const gscMetrics = pgTable(
  'gsc_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .references(() => sites.id, { onDelete: 'cascade' })
      .notNull(),

    date: date('date').notNull(),
    pageUrl: text('page_url').notNull(),
    query: text('query').notNull(),

    clicks: integer('clicks').default(0),
    impressions: integer('impressions').default(0),
    ctr: decimal('ctr', { precision: 6, scale: 4 }).default('0'),
    position: decimal('position', { precision: 6, scale: 2 }).default('0'),

    country: text('country'),
    device: text('device'),
  },
  (table) => [
    unique('uq_gsc_row').on(
      table.siteId,
      table.date,
      table.pageUrl,
      table.query,
      table.country,
      table.device
    ),
    index('idx_gsc_site_date').on(table.siteId, table.date),
    index('idx_gsc_query').on(table.siteId, table.query),
    index('idx_gsc_page').on(table.siteId, table.pageUrl),
  ]
);

// ─── CRAWL DATA ───────────────────────────────────────────────
export const crawlData = pgTable(
  'crawl_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .references(() => sites.id, { onDelete: 'cascade' })
      .notNull(),
    crawledAt: timestamp('crawled_at', { withTimezone: true }).defaultNow(),

    url: text('url').notNull(),
    httpStatus: integer('http_status'),

    title: text('title'),
    titleLength: integer('title_length'),
    metaDescription: text('meta_description'),
    metaDescriptionLength: integer('meta_description_length'),
    h1: text('h1').array(),
    h2: text('h2').array(),
    canonicalUrl: text('canonical_url'),
    robotsMeta: text('robots_meta'),

    ogTitle: text('og_title'),
    ogDescription: text('og_description'),
    ogImage: text('og_image'),

    hasJsonLd: boolean('has_json_ld').default(false),
    jsonLdTypes: text('json_ld_types').array(),

    imagesWithoutAlt: integer('images_without_alt').default(0),
    totalImages: integer('total_images').default(0),

    internalLinks: integer('internal_links').default(0),
    externalLinks: integer('external_links').default(0),

    performanceScore: integer('performance_score'),
    lcpMs: integer('lcp_ms'),
    clsScore: decimal('cls_score', { precision: 5, scale: 3 }),
    fidMs: integer('fid_ms'),
    ttfbMs: integer('ttfb_ms'),

    onPageScore: integer('on_page_score'),
    technicalScore: integer('technical_score'),
  },
  (table) => [
    unique('uq_crawl_site_url').on(table.siteId, table.url),
    index('idx_crawl_site').on(table.siteId),
    index('idx_crawl_score').on(table.siteId, table.onPageScore),
  ]
);

// ─── ISSUES ───────────────────────────────────────────────────
export const issues = pgTable(
  'issues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .references(() => sites.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),

    category: text('category').notNull(),
    severity: text('severity').notNull(),
    issueType: text('issue_type').notNull(),

    affectedUrl: text('affected_url'),
    affectedQuery: text('affected_query'),

    title: text('title').notNull(),
    description: text('description').notNull(),
    impact: text('impact').notNull(),

    fixSnippet: text('fix_snippet'),
    fixDocsUrl: text('fix_docs_url'),

    status: text('status').default('open'),
    isNew: boolean('is_new').default(true),

    fingerprint: text('fingerprint').unique().notNull(),
  },
  (table) => [
    index('idx_issues_site_severity').on(
      table.siteId,
      table.severity,
      table.status
    ),
    index('idx_issues_category').on(table.siteId, table.category),
  ]
);

// ─── AI INSIGHTS ──────────────────────────────────────────────
export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id')
    .references(() => sites.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  insightType: text('insight_type').notNull(),
  relatedIssueId: uuid('related_issue_id').references(() => issues.id),
  relatedUrl: text('related_url'),
  relatedQuery: text('related_query'),

  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),

  content: text('content').notNull(),
  dataHash: text('data_hash'),
});

// ─── KEYWORD POSITIONS ────────────────────────────────────────
export const keywordPositions = pgTable(
  'keyword_positions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .references(() => sites.id, { onDelete: 'cascade' })
      .notNull(),
    recordedAt: date('recorded_at').notNull(),

    query: text('query').notNull(),
    pageUrl: text('page_url').notNull(),
    position: decimal('position', { precision: 6, scale: 2 }).notNull(),
    impressions: integer('impressions').notNull(),
    clicks: integer('clicks').notNull(),
  },
  (table) => [
    unique('uq_kp_row').on(
      table.siteId,
      table.recordedAt,
      table.query,
      table.pageUrl
    ),
    index('idx_kp_site_query').on(table.siteId, table.query, table.recordedAt),
  ]
);

// ─── RELATIONS ────────────────────────────────────────────────
export const sitesRelations = relations(sites, ({ many }) => ({
  gscMetrics: many(gscMetrics),
  crawlData: many(crawlData),
  issues: many(issues),
  aiInsights: many(aiInsights),
  keywordPositions: many(keywordPositions),
}));

export const gscMetricsRelations = relations(gscMetrics, ({ one }) => ({
  site: one(sites, { fields: [gscMetrics.siteId], references: [sites.id] }),
}));

export const crawlDataRelations = relations(crawlData, ({ one }) => ({
  site: one(sites, { fields: [crawlData.siteId], references: [sites.id] }),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  site: one(sites, { fields: [issues.siteId], references: [sites.id] }),
  aiInsights: many(aiInsights),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  site: one(sites, { fields: [aiInsights.siteId], references: [sites.id] }),
  relatedIssue: one(issues, {
    fields: [aiInsights.relatedIssueId],
    references: [issues.id],
  }),
}));

export const keywordPositionsRelations = relations(
  keywordPositions,
  ({ one }) => ({
    site: one(sites, {
      fields: [keywordPositions.siteId],
      references: [sites.id],
    }),
  })
);
