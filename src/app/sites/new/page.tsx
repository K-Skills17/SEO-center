'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    gscPropertyUrl: '',
    sitemapUrl: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const site = await res.json();
        router.push(`/sites/${site.id}/settings`);
      }
    } catch (error) {
      console.error('Failed to create site:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleDomainChange(domain: string) {
    setForm({
      ...form,
      domain,
      gscPropertyUrl: domain ? `https://${domain}/` : '',
      sitemapUrl: domain ? `https://${domain}/sitemap.xml` : '',
    });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-8">
        <PageHeader
          title="Adicionar Novo Site"
          description="Conecte um site para comecar o monitoramento de SEO"
        />

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Detalhes do Site</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nome do Site
                </label>
                <Input
                  placeholder="Ex: Clinica Odonto Sao Paulo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Dominio
                </label>
                <Input
                  placeholder="Ex: clinica.com.br"
                  value={form.domain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  GSC Property URL
                </label>
                <Input
                  placeholder="Ex: https://clinica.com.br/ ou sc-domain:clinica.com.br"
                  value={form.gscPropertyUrl}
                  onChange={(e) =>
                    setForm({ ...form, gscPropertyUrl: e.target.value })
                  }
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  O URL da propriedade no Google Search Console
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Sitemap URL
                </label>
                <Input
                  placeholder="Ex: https://clinica.com.br/sitemap.xml"
                  value={form.sitemapUrl}
                  onChange={(e) =>
                    setForm({ ...form, sitemapUrl: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Site'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
