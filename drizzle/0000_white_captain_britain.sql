CREATE TABLE "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"insight_type" text NOT NULL,
	"related_issue_id" uuid,
	"related_url" text,
	"related_query" text,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"content" text NOT NULL,
	"data_hash" text
);
--> statement-breakpoint
CREATE TABLE "crawl_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"crawled_at" timestamp with time zone DEFAULT now(),
	"url" text NOT NULL,
	"http_status" integer,
	"title" text,
	"title_length" integer,
	"meta_description" text,
	"meta_description_length" integer,
	"h1" text[],
	"h2" text[],
	"canonical_url" text,
	"robots_meta" text,
	"og_title" text,
	"og_description" text,
	"og_image" text,
	"has_json_ld" boolean DEFAULT false,
	"json_ld_types" text[],
	"images_without_alt" integer DEFAULT 0,
	"total_images" integer DEFAULT 0,
	"internal_links" integer DEFAULT 0,
	"external_links" integer DEFAULT 0,
	"performance_score" integer,
	"lcp_ms" integer,
	"cls_score" numeric(5, 3),
	"fid_ms" integer,
	"ttfb_ms" integer,
	"on_page_score" integer,
	"technical_score" integer,
	CONSTRAINT "uq_crawl_site_url" UNIQUE("site_id","url")
);
--> statement-breakpoint
CREATE TABLE "gsc_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"date" date NOT NULL,
	"page_url" text NOT NULL,
	"query" text NOT NULL,
	"clicks" integer DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"ctr" numeric(6, 4) DEFAULT '0',
	"position" numeric(6, 2) DEFAULT '0',
	"country" text,
	"device" text,
	CONSTRAINT "uq_gsc_row" UNIQUE("site_id","date","page_url","query","country","device")
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"resolved_at" timestamp with time zone,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"issue_type" text NOT NULL,
	"affected_url" text,
	"affected_query" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"impact" text NOT NULL,
	"fix_snippet" text,
	"fix_docs_url" text,
	"status" text DEFAULT 'open',
	"is_new" boolean DEFAULT true,
	"fingerprint" text NOT NULL,
	CONSTRAINT "issues_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "keyword_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"recorded_at" date NOT NULL,
	"query" text NOT NULL,
	"page_url" text NOT NULL,
	"position" numeric(6, 2) NOT NULL,
	"impressions" integer NOT NULL,
	"clicks" integer NOT NULL,
	CONSTRAINT "uq_kp_row" UNIQUE("site_id","recorded_at","query","page_url")
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"gsc_property_url" text NOT NULL,
	"sitemap_url" text,
	"gsc_access_token" text,
	"gsc_refresh_token" text,
	"gsc_token_expiry" timestamp with time zone,
	"last_gsc_sync" timestamp with time zone,
	"last_crawl_sync" timestamp with time zone,
	"sync_status" text DEFAULT 'pending',
	"sync_error" text,
	"health_score" integer,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "sites_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_related_issue_id_issues_id_fk" FOREIGN KEY ("related_issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_data" ADD CONSTRAINT "crawl_data_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gsc_metrics" ADD CONSTRAINT "gsc_metrics_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_positions" ADD CONSTRAINT "keyword_positions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_crawl_site" ON "crawl_data" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_crawl_score" ON "crawl_data" USING btree ("site_id","on_page_score");--> statement-breakpoint
CREATE INDEX "idx_gsc_site_date" ON "gsc_metrics" USING btree ("site_id","date");--> statement-breakpoint
CREATE INDEX "idx_gsc_query" ON "gsc_metrics" USING btree ("site_id","query");--> statement-breakpoint
CREATE INDEX "idx_gsc_page" ON "gsc_metrics" USING btree ("site_id","page_url");--> statement-breakpoint
CREATE INDEX "idx_issues_site_severity" ON "issues" USING btree ("site_id","severity","status");--> statement-breakpoint
CREATE INDEX "idx_issues_category" ON "issues" USING btree ("site_id","category");--> statement-breakpoint
CREATE INDEX "idx_kp_site_query" ON "keyword_positions" USING btree ("site_id","query","recorded_at");