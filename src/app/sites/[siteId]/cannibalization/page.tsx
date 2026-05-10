'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { CannibalizationTable } from '@/components/cannibalization/CannibalizationTable';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';

export default function CannibalizationPage() {
  const params = useParams<{ siteId: string }>();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/sites/${params.siteId}/issues?category=cannibalization&status=open`
        );
        setIssues(await res.json());
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
        title="Canibalizacao de Keywords"
        description="Keywords que estao divididas entre multiplas paginas"
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <CannibalizationTable issues={issues} />
      )}
    </div>
  );
}
