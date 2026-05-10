'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SiteDetail {
  id: string;
  name: string;
  domain: string;
  gscPropertyUrl: string;
  sitemapUrl: string | null;
  gscAccessToken: string | null;
  syncStatus: string | null;
}

export default function SettingsPage() {
  const params = useParams<{ siteId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const connected = searchParams.get('connected');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sites/${params.siteId}`);
        setSite(await res.json());
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.siteId]);

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja remover este site e todos os dados?'))
      return;
    await fetch(`/api/sites/${params.siteId}`, { method: 'DELETE' });
    router.push('/dashboard');
  }

  if (loading || !site) return <p>Carregando...</p>;

  return (
    <div>
      <PageHeader title="Configuracoes" description={site.domain} />

      {connected && (
        <div className="mb-6 rounded-lg bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Google Search Console conectado com sucesso!
          </p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* GSC Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Google Search Console
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm">Status:</span>
              {site.gscAccessToken ? (
                <Badge className="bg-emerald-100 text-emerald-700">
                  Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-700">
                  Nao conectado
                </Badge>
              )}
            </div>
            <a
              href={`/api/auth/gsc/connect?siteId=${site.id}`}
              className={buttonVariants()}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {site.gscAccessToken ? 'Reconectar GSC' : 'Conectar GSC'}
            </a>
          </CardContent>
        </Card>

        {/* Site Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacoes do Site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <Input value={site.name} readOnly />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dominio</label>
              <Input value={site.domain} readOnly />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                GSC Property
              </label>
              <Input value={site.gscPropertyUrl} readOnly />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Sitemap URL
              </label>
              <Input value={site.sitemapUrl || ''} readOnly />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-600">
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Remover este site ira apagar todos os dados de GSC, crawl, issues
              e insights de IA associados.
            </p>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remover Site
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
