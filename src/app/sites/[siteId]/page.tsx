'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { HealthScoreRing } from '@/components/dashboard/HealthScoreRing';
import { AIInsightPanel } from '@/components/ai/AIInsightPanel';
import { SyncButton } from '@/components/shared/SyncButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';

interface SiteDetail {
  id: string;
  name: string;
  domain: string;
  healthScore: number | null;
  syncStatus: string | null;
  openIssues: number;
  criticalIssues: number;
}

export default function SiteOverviewPage() {
  const params = useParams<{ siteId: string }>();
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState<
    { query: string; impressions: number; avgPosition: number; clicks: number }[]
  >([]);
  const [pages, setPages] = useState<
    { pageUrl: string; clicks: number; avgCtr: number }[]
  >([]);

  useEffect(() => {
    async function load() {
      try {
        const [siteRes, kwRes, pagesRes] = await Promise.all([
          fetch(`/api/sites/${params.siteId}`),
          fetch(`/api/sites/${params.siteId}/gsc/keywords?limit=5&sort=impressions`),
          fetch(`/api/sites/${params.siteId}/gsc/pages?limit=5&sort=clicks`),
        ]);
        setSite(await siteRes.json());
        setKeywords(await kwRes.json());
        setPages(await pagesRes.json());
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.siteId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!site) return <p>Site nao encontrado</p>;

  return (
    <div>
      <PageHeader
        title={site.name}
        description={site.domain}
        actions={
          <SyncButton
            siteId={site.id}
            onComplete={() => window.location.reload()}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Health Score + Metrics */}
          <Card>
            <CardContent className="flex items-center gap-8 pt-6">
              <HealthScoreRing score={site.healthScore} size={120} />
              <div className="grid flex-1 grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {site.criticalIssues}
                  </p>
                  <p className="text-xs text-muted-foreground">Criticos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">
                    {site.openIssues - site.criticalIssues}
                  </p>
                  <p className="text-xs text-muted-foreground">Avisos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{site.openIssues}</p>
                  <p className="text-xs text-muted-foreground">Total Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Top Keywords (por impressoes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {keywords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sincronize o site para ver as keywords
                </p>
              ) : (
                <div className="space-y-3">
                  {keywords.map((kw) => (
                    <div
                      key={kw.query}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{kw.query}</span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Pos {kw.avgPosition?.toFixed(1)}</span>
                        <span>{kw.clicks} cliques</span>
                        <span>{kw.impressions.toLocaleString()} imp</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Top Paginas (por cliques)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sincronize o site para ver as paginas
                </p>
              ) : (
                <div className="space-y-3">
                  {pages.map((page) => (
                    <div
                      key={page.pageUrl}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                    >
                      <span className="max-w-[300px] truncate text-sm font-medium">
                        {page.pageUrl.replace(/https?:\/\/[^/]+/, '') || '/'}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{page.clicks} cliques</span>
                        <span>
                          {(page.avgCtr * 100).toFixed(1)}% CTR
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Panel */}
        <div>
          <AIInsightPanel siteId={site.id} />
        </div>
      </div>
    </div>
  );
}
