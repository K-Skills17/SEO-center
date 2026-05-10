'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { SiteCard } from '@/components/dashboard/SiteCard';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Globe } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

interface Site {
  id: string;
  name: string;
  domain: string;
  healthScore: number | null;
  syncStatus: string | null;
  lastGscSync: string | null;
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch('/api/sites');
      const data = await res.json();
      setSites(data);
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const criticalSites = sites.filter(
    (s) => s.healthScore !== null && s.healthScore < 40
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-8">
        <PageHeader
          title="Portfolio"
          description={`${sites.length} sites monitorados`}
          actions={
            <Link href="/sites/new" className={buttonVariants()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Site
            </Link>
          }
        />

        {criticalSites.length > 0 && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {criticalSites.length} site(s) precisam de atencao imediata
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="Nenhum site cadastrado"
            description='Clique em "Adicionar Site" para comecar a monitorar o SEO do seu primeiro site.'
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                onSyncComplete={fetchSites}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
