'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScoreBar } from '@/components/shared/ScoreBar';

interface PageRow {
  pageUrl: string;
  title: string | null;
  clicks: number;
  impressions: number;
  avgCtr: number;
  avgPosition: number;
  onPageScore: number | null;
  technicalScore: number | null;
  performanceScore: number | null;
  lcpMs: number | null;
  clsScore: string | null;
  lastCrawled: string | null;
}

export function PageAuditTable({ pages }: { pages: PageRow[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[250px]">URL</TableHead>
            <TableHead>Titulo</TableHead>
            <TableHead>On-Page</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead>CWV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.pageUrl}>
              <TableCell className="max-w-[250px] truncate text-xs font-medium">
                {page.pageUrl.replace(/https?:\/\/[^/]+/, '') || '/'}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm">
                {page.title || <span className="text-red-500">Sem titulo</span>}
              </TableCell>
              <TableCell>
                <ScoreBar score={page.onPageScore} />
              </TableCell>
              <TableCell>
                <ScoreBar score={page.performanceScore} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {page.clicks.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {(page.avgCtr * 100).toFixed(2)}%
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {page.lcpMs ? `LCP ${page.lcpMs}ms` : '--'}
              </TableCell>
            </TableRow>
          ))}
          {pages.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Nenhuma pagina encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
