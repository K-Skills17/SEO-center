'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function AIInsightPanel({
  siteId,
  existingContent,
  lastUpdated,
}: {
  siteId: string;
  existingContent?: string | null;
  lastUpdated?: string | null;
}) {
  const [content, setContent] = useState(existingContent || null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/ai/overview`, {
        method: 'POST',
      });
      const data = await res.json();
      setContent(data.content);
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-indigo-600" />
          Diagnostico IA
        </CardTitle>
        <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
          <RefreshCw className={`mr-1 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          {content ? 'Regenerar' : 'Gerar'}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : content ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Clique em &quot;Gerar&quot; para receber uma analise de IA sobre o
            SEO deste site.
          </p>
        )}
        {lastUpdated && content && (
          <p className="mt-4 text-xs text-muted-foreground">
            Atualizado: {new Date(lastUpdated).toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
