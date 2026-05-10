'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { IssueQueue } from '@/components/issues/IssueQueue';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';

export default function IssuesPage() {
  const params = useParams<{ siteId: string }>();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    try {
      const res = await fetch(`/api/sites/${params.siteId}/issues?status=open`);
      setIssues(await res.json());
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [params.siteId]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  return (
    <div>
      <PageHeader
        title="Issues"
        description="Problemas detectados e oportunidades de melhoria"
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <IssueQueue
          issues={issues}
          siteId={params.siteId}
          onRefresh={loadIssues}
          severityFilter={severityFilter}
          onSeverityChange={setSeverityFilter}
        />
      )}
    </div>
  );
}
