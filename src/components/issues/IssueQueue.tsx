'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssueCard } from './IssueCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { AlertTriangle } from 'lucide-react';

interface Issue {
  id: string;
  category: string;
  severity: string;
  issueType: string;
  title: string;
  description: string;
  impact: string;
  affectedUrl: string | null;
  affectedQuery: string | null;
  fixSnippet: string | null;
  status: string;
  isNew: boolean;
}

const categories = [
  { value: 'all', label: 'Todos' },
  { value: 'on_page', label: 'On-Page' },
  { value: 'technical', label: 'Tecnico' },
  { value: 'performance', label: 'Performance' },
  { value: 'content', label: 'Conteudo' },
  { value: 'cannibalization', label: 'Canibalizacao' },
];

export function IssueQueue({
  issues,
  siteId,
  onRefresh,
  severityFilter,
  onSeverityChange,
}: {
  issues: Issue[];
  siteId: string;
  onRefresh?: () => void;
  severityFilter?: string | null;
  onSeverityChange?: (severity: string | null) => void;
}) {
  const severityFilters = [
    { value: null, label: 'Todos' },
    { value: 'critical', label: 'Criticos' },
    { value: 'warning', label: 'Avisos' },
    { value: 'opportunity', label: 'Oportunidades' },
  ];

  const filtered = severityFilter
    ? issues.filter((i) => i.severity === severityFilter)
    : issues;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {severityFilters.map((f) => (
          <button
            key={f.value ?? 'all'}
            onClick={() => onSeverityChange?.(f.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              severityFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
            {f.value && (
              <span className="ml-1 text-xs">
                ({issues.filter((i) => i.severity === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
              <span className="ml-1 text-xs text-muted-foreground">
                (
                {cat.value === 'all'
                  ? filtered.length
                  : filtered.filter((i) => i.category === cat.value).length}
                )
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => {
          const catIssues =
            cat.value === 'all'
              ? filtered
              : filtered.filter((i) => i.category === cat.value);

          return (
            <TabsContent key={cat.value} value={cat.value}>
              {catIssues.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="Nenhum problema encontrado"
                  description="Boa noticia! Nao ha issues nesta categoria."
                />
              ) : (
                <div className="space-y-4">
                  {catIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      siteId={siteId}
                      onStatusChange={onRefresh}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
