'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageAuditTable } from '@/components/pages/PageAuditTable';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';

export default function PagesAuditPage() {
  const params = useParams<{ siteId: string }>();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/sites/${params.siteId}/gsc/pages?sort=clicks&limit=200`
        );
        setPages(await res.json());
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.siteId]);

  return (
    <div>
      <PageHeader
        title="Auditoria de Paginas"
        description="Score SEO e sinais on-page por URL"
      />

      {loading ? <TableSkeleton rows={10} /> : <PageAuditTable pages={pages} />}
    </div>
  );
}
