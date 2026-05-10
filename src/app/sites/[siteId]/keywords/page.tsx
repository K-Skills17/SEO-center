'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { KeywordTable } from '@/components/keywords/KeywordTable';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';

interface KeywordRow {
  query: string;
  pageUrl: string;
  clicks: number;
  impressions: number;
  avgCtr: number;
  avgPosition: number;
}

export default function KeywordsPage() {
  const params = useParams<{ siteId: string }>();
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('impressions');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/sites/${params.siteId}/gsc/keywords?sort=${sort}&limit=200`
        );
        setKeywords(await res.json());
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.siteId, sort]);

  return (
    <div>
      <PageHeader
        title="Keywords"
        description="Ranking de palavras-chave no Google Search Console"
      />

      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <KeywordTable keywords={keywords} onSort={setSort} />
      )}
    </div>
  );
}
