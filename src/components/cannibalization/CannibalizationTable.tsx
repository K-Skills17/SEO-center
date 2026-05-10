'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Copy } from 'lucide-react';

interface CannibalizationIssue {
  id: string;
  affectedQuery: string | null;
  affectedUrl: string | null;
  description: string;
}

export function CannibalizationTable({
  issues,
}: {
  issues: CannibalizationIssue[];
}) {
  if (issues.length === 0) {
    return (
      <EmptyState
        icon={Copy}
        title="Nenhuma canibalizacao detectada"
        description="Suas paginas nao estao competindo entre si para as mesmas keywords."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-md bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">
          {issues.length} keywords estao divididas entre multiplas paginas
        </p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Pagina Principal</TableHead>
              <TableHead>Descricao</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">
                  {issue.affectedQuery}
                </TableCell>
                <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground">
                  {issue.affectedUrl?.replace(/https?:\/\/[^/]+/, '') || '--'}
                </TableCell>
                <TableCell className="max-w-[300px] text-sm">
                  {issue.description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700">
                    Consolidar
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
