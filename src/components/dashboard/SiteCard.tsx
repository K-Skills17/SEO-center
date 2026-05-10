'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthScoreRing } from './HealthScoreRing';
import { SyncButton } from '@/components/shared/SyncButton';
import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SiteCardProps {
  site: {
    id: string;
    name: string;
    domain: string;
    healthScore: number | null;
    syncStatus: string | null;
    lastGscSync: string | null;
    totalClicks?: number;
    avgPosition?: number;
    openIssues?: number;
  };
  onSyncComplete?: () => void;
}

export function SiteCard({ site, onSyncComplete }: SiteCardProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    syncing: { label: 'Sincronizando...', className: 'bg-blue-100 text-blue-700' },
    done: { label: 'Atualizado', className: 'bg-emerald-100 text-emerald-700' },
    error: { label: 'Erro', className: 'bg-red-100 text-red-700' },
    pending: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' },
  };

  const status = statusConfig[site.syncStatus || 'pending'] || statusConfig.pending;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{site.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{site.domain}</p>
        </div>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <HealthScoreRing score={site.healthScore} size={80} />
          <div className="grid flex-1 grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {site.totalClicks?.toLocaleString() ?? '--'}
              </p>
              <p className="text-xs text-muted-foreground">Cliques (28d)</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {site.avgPosition?.toFixed(1) ?? '--'}
              </p>
              <p className="text-xs text-muted-foreground">Posicao media</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{site.openIssues ?? '--'}</p>
              <p className="text-xs text-muted-foreground">Issues abertas</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-xs text-muted-foreground">
            {site.lastGscSync
              ? `Sincronizado ${formatDistanceToNow(new Date(site.lastGscSync), { addSuffix: true, locale: ptBR })}`
              : 'Nunca sincronizado'}
          </span>
          <div className="flex gap-2">
            <SyncButton siteId={site.id} onComplete={onSyncComplete} />
            <Link href={`/sites/${site.id}`} className={buttonVariants({ size: 'sm' })}>
              Ver site <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
