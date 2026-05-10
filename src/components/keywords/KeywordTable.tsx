'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { Search } from 'lucide-react';

interface KeywordRow {
  query: string;
  pageUrl: string;
  clicks: number;
  impressions: number;
  avgCtr: number;
  avgPosition: number;
}

export function KeywordTable({
  keywords,
  onSort,
}: {
  keywords: KeywordRow[];
  onSort?: (field: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? keywords.filter((k) =>
        k.query.toLowerCase().includes(search.toLowerCase())
      )
    : keywords;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => onSort?.('query')}
              >
                Keyword
              </TableHead>
              <TableHead className="w-[250px]">Pagina</TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => onSort?.('position')}
              >
                Posicao
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => onSort?.('clicks')}
              >
                Cliques
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => onSort?.('impressions')}
              >
                Impressoes
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => onSort?.('ctr')}
              >
                CTR
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((kw, i) => (
              <TableRow key={`${kw.query}-${kw.pageUrl}-${i}`}>
                <TableCell className="font-medium">{kw.query}</TableCell>
                <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground">
                  {kw.pageUrl.replace(/https?:\/\/[^/]+/, '')}
                </TableCell>
                <TableCell className="text-right">
                  <PositionBadge position={kw.avgPosition} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {kw.clicks.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {kw.impressions.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {(kw.avgCtr * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhuma keyword encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
