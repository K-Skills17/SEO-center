'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { CopyButton } from '@/components/shared/CopyButton';
import { Badge } from '@/components/ui/badge';
import { Bot, Check, X } from 'lucide-react';

interface IssueData {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  impact: string;
  affectedUrl: string | null;
  affectedQuery: string | null;
  fixSnippet: string | null;
  status: string;
  isNew: boolean;
}

export function IssueCard({
  issue,
  siteId,
  onStatusChange,
}: {
  issue: IssueData;
  siteId: string;
  onStatusChange?: () => void;
}) {
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  async function handleAiFix() {
    setLoadingAi(true);
    try {
      const res = await fetch(
        `/api/sites/${siteId}/issues/${issue.id}/ai`,
        { method: 'POST' }
      );
      const data = await res.json();
      setAiContent(data.content);
    } catch (error) {
      console.error('AI fix error:', error);
    } finally {
      setLoadingAi(false);
    }
  }

  async function updateStatus(status: string) {
    try {
      await fetch(`/api/sites/${siteId}/issues/${issue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onStatusChange?.();
    } catch (error) {
      console.error('Status update error:', error);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={issue.severity} />
          <Badge variant="outline" className="text-xs">
            {issue.category}
          </Badge>
          {issue.isNew && (
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="font-semibold">{issue.title}</h3>
        {issue.affectedUrl && (
          <p className="text-xs text-muted-foreground">
            {issue.affectedUrl}
          </p>
        )}
        <p className="text-sm text-muted-foreground">{issue.description}</p>
        <div className="rounded-md bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800">
            IMPACTO: {issue.impact}
          </p>
        </div>

        {issue.fixSnippet && (
          <div className="relative rounded-md bg-zinc-950 p-4">
            <div className="absolute right-2 top-2">
              <CopyButton text={issue.fixSnippet} />
            </div>
            <pre className="overflow-x-auto text-xs text-zinc-200">
              <code>{issue.fixSnippet}</code>
            </pre>
          </div>
        )}

        {aiContent && (
          <div className="rounded-md border border-indigo-200 bg-indigo-50 p-4">
            <p className="mb-2 text-xs font-semibold text-indigo-700">
              Recomendacao IA
            </p>
            <div className="prose prose-sm max-w-none text-sm">
              {aiContent}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAiFix}
            disabled={loadingAi}
          >
            <Bot className="mr-1 h-4 w-4" />
            {loadingAi ? 'Gerando...' : 'AI Fix'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateStatus('resolved')}
          >
            <Check className="mr-1 h-4 w-4" />
            Resolvido
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateStatus('ignored')}
          >
            <X className="mr-1 h-4 w-4" />
            Ignorar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
