'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SyncButton({
  siteId,
  onComplete,
}: {
  siteId: string;
  onComplete?: () => void;
}) {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/sync?type=full`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Sync failed');
      onComplete?.();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
    >
      <RefreshCw className={cn('mr-2 h-4 w-4', syncing && 'animate-spin')} />
      {syncing ? 'Sincronizando...' : 'Sincronizar'}
    </Button>
  );
}
