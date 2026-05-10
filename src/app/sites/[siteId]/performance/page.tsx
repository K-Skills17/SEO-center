'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricsGrid } from '@/components/performance/MetricsGrid';
import { PerformanceChart } from '@/components/performance/PerformanceChart';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { ChartSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAppStore } from '@/lib/store';

export default function PerformancePage() {
  const params = useParams<{ siteId: string }>();
  const { dateRange } = useAppStore();
  const [data, setData] = useState<{
    timeSeries: { date: string; clicks: number; impressions: number; avgCtr: number; avgPosition: number }[];
    totals: { totalClicks: number; totalImpressions: number; avgCtr: number; avgPosition: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/sites/${params.siteId}/gsc/performance?period=${dateRange}`
        );
        setData(await res.json());
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.siteId, dateRange]);

  return (
    <div>
      <PageHeader
        title="Performance"
        description="Dados do Google Search Console"
        actions={<DateRangePicker />}
      />

      {loading || !data ? (
        <div className="space-y-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="space-y-6">
          <MetricsGrid totals={data.totals} />
          <PerformanceChart data={data.timeSeries} />
        </div>
      )}
    </div>
  );
}
