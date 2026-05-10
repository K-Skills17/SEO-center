# Relatorio SEO Completo — LK Digital (lkdigital.odo.br)
**Data:** 10 de maio de 2026
**Health Score:** 81/100
**Total de Issues:** 178 (160 warnings, 18 oportunidades)
**Paginas Analisadas:** 76

---

## RESUMO EXECUTIVO

O site esta em boa forma estrutural (score 81), sem nenhum issue critico. Os 178 problemas se dividem em **5 categorias**, todas corrigiveis de forma sistematica. A maioria sao problemas de template que podem ser resolvidos em batch — corrigir o template das paginas de cidade, por exemplo, resolve 15 issues de titulo + 15 de meta description de uma vez.

**Nota importante:** O Google Search Console nao retornou dados de performance (0 linhas). Isso indica que a conexao OAuth nao completou corretamente ou o site ainda nao tem dados suficientes no GSC. Recomendo reconectar o GSC no SEO Command Center.

---

## PRIORIDADE 1: Open Graph Tags Ausentes (76 paginas)
**Severidade:** Warning | **Impacto:** Alto

Nenhuma pagina do site tem OG tags (og:title, og:description, og:image). Isso significa que quando alguem compartilha qualquer pagina no LinkedIn, Facebook, WhatsApp ou Twitter, o preview aparece quebrado ou com informacoes genericas.

### Como Corrigir (Solucao Global)

No Next.js, adicione OG tags no layout raiz ou em cada pagina via `metadata`:

**Opcao A — Layout Global (src/app/layout.tsx):**
```tsx
export const metadata = {
  openGraph: {
    type: 'website',
    siteName: 'LK Digital',
    images: [{ url: 'https://lkdigital.odo.br/og-default.jpg', width: 1200, height: 630 }],
  },
};
```

**Opcao B — Por pagina (recomendado para blog e cidades):**
```tsx
// src/app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return {
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage, width: 1200, height: 630 }],
      type: 'article',
    },
  };
}
```

**Opcao C — Para paginas de cidade (template):**
```tsx
// src/app/cidades/[cidade]/page.tsx
export async function generateMetadata({ params }) {
  const city = formatCityName(params.cidade);
  return {
    openGraph: {
      title: `Marketing Digital para Dentistas em ${city} | LK Digital`,
      description: `Agencia especializada em marketing odontologico em ${city}. Sites, SEO e Google Ads.`,
      images: [{ url: `https://lkdigital.odo.br/og-cidade-${params.cidade}.jpg` }],
    },
  };
}
```

### Paginas Afetadas
Todas as 76 paginas do site. Resolver no layout global + templates de blog/cidades cobre tudo.

---

## PRIORIDADE 2: Titulos Muito Longos (60 paginas)
**Severidade:** Warning | **Impacto:** Medio-Alto

Google trunca titulos acima de ~60 caracteres no SERP. 60 paginas tem titulos cortados, prejudicando o CTR.

### Blog (39 paginas) — Correcao em Template

Todos os posts do blog tem titulo longo. O padrao e adicionar sufixo tipo "| LK Digital" ao titulo do post, o que estoura o limite.

**Solucao:** Remover ou encurtar o sufixo da marca nos titulos do blog.

```tsx
// ANTES (exemplo: 95 caracteres)
// "IA esta Mudando Buscas: Dentistas Que Nao se Adaptarem Vao Desaparecer | LK Digital"

// DEPOIS (exemplo: 55 caracteres)
// "IA nas Buscas: Dentistas Precisam se Adaptar em 2025"

// src/app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  // Nao adicionar " | LK Digital" se titulo > 45 chars
  const title = post.title.length > 45
    ? post.title
    : `${post.title} | LK Digital`;
  return { title };
}
```

**Top 5 piores (precisam reescrita manual):**
| URL | Chars | Acao |
|-----|-------|------|
| /blog/ia-busca-dentistas | 95 | Reescrever titulo completo |
| /blog/seo-local-dentistas-guia-completo | 92 | Reescrever titulo completo |
| /blog/google-meu-negocio-dentista | 90 | Reescrever titulo completo |
| /blog/ferramentas | 89 | Reescrever titulo completo |
| /blog/regras-cfo-publicidade | 86 | Reescrever titulo completo |

### Cidades (15 paginas) — Correcao em Template

Todas as paginas de cidade usam o mesmo padrao de titulo longo.

**Solucao:**
```tsx
// ANTES: "Marketing Digital para Dentistas em Belo Horizonte | LK Digital" (79 chars)
// DEPOIS: "Marketing para Dentistas em Belo Horizonte" (42 chars)
// ou: "Dentistas em Belo Horizonte | LK Digital" (40 chars)

export async function generateMetadata({ params }) {
  const city = formatCityName(params.cidade);
  return {
    title: `Marketing para Dentistas em ${city}`, // Sem sufixo
  };
}
```

### Paginas EN/FR (8 paginas)

| URL | Chars | Sugestao de Titulo |
|-----|-------|--------------------|
| /en | 66 | "Dental Marketing Agency \| LK Digital" (38ch) |
| /en/about | 72 | "About LK Digital \| Dental Marketing" (36ch) |
| /en/tools | 73 | "Free Dental Marketing Tools" (28ch) |
| /fr | 71 | "Agence Marketing Dentaire \| LK Digital" (40ch) |
| /fr/a-propos | 90 | "A Propos de LK Digital" (22ch) |
| /fr/outils | 77 | "Outils Marketing Dentaire Gratuits" (34ch) |

### Paginas Institucionais

| URL | Chars | Sugestao de Titulo |
|-----|-------|--------------------|
| /cidades (hub) | 69 | "Dentistas por Cidade \| LK Digital" (34ch) |
| /faq | 70 | "Perguntas Frequentes \| LK Digital" (34ch) |
| /ferramentas | 89 | "Ferramentas Gratuitas \| LK Digital" (35ch) |
| /segmentos | 67 | "Segmentos Atendidos \| LK Digital" (33ch) |

---

## PRIORIDADE 3: Meta Descriptions Muito Longas (23 paginas)
**Severidade:** Warning | **Impacto:** Medio

Google trunca meta descriptions acima de ~158 caracteres. 23 paginas tem descricoes cortadas.

### Cidades (16 paginas) — Correcao em Template

Todas as paginas de cidade tem meta description longa (189-207 chars). Corrigir o template resolve todas.

```tsx
// ANTES (207 chars):
// "Agencia de marketing digital especializada em odontologia em Belo Horizonte.
//  Criamos sites profissionais, gerenciamos Google Ads e implementamos estrategias
//  de SEO para dentistas e clinicas odontologicas."

// DEPOIS (148 chars):
// "Marketing digital para dentistas em Belo Horizonte. Sites, Google Ads e SEO
//  para lotar sua agenda. Resultados em 90 dias."

export async function generateMetadata({ params }) {
  const city = formatCityName(params.cidade);
  return {
    description: `Marketing digital para dentistas em ${city}. Sites, Google Ads e SEO para lotar sua agenda. Resultados em 90 dias.`,
  };
}
```

### Outras Paginas (7 paginas)

| URL | Chars | Acao |
|-----|-------|------|
| /ferramentas | 185 | Reescrever para < 158 chars |
| /fr/solutions | 186 | Reescrever para < 158 chars |
| /fr/a-propos | 176 | Reescrever para < 158 chars |
| /fr | 166 | Reescrever para < 158 chars |
| /blog/concorrente-dominando-google | 164 | Reescrever para < 158 chars |
| /segmentos | 163 | Reescrever para < 158 chars |
| /sobre | 162 | Reescrever para < 158 chars |

---

## PRIORIDADE 4: Structured Data JSON-LD Ausente (18 paginas)
**Severidade:** Oportunidade | **Impacto:** Medio

18 paginas nao tem JSON-LD. Structured data habilita rich snippets no Google (estrelas, FAQ, breadcrumbs), que podem aumentar CTR em 20-30%.

### Quais schemas adicionar por tipo de pagina:

**FAQ (/faq):**
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": { "@type": "Answer", "text": item.answer }
  }))
}) }} />
```

**Sobre/About/A-propos:**
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LK Digital",
  "url": "https://lkdigital.odo.br",
  "description": "Agencia de marketing digital especializada em odontologia",
  "address": { "@type": "PostalAddress", "addressCountry": "BR" }
}) }} />
```

**Contato/Contact:**
```tsx
// ContactPage schema
{ "@type": "ContactPage", "name": "Contato", "url": "https://lkdigital.odo.br/contato" }
```

**Paginas legais (termos, privacidade):**
```tsx
// WebPage schema basico
{ "@type": "WebPage", "name": "Termos de Uso", "url": "https://lkdigital.odo.br/termos" }
```

**Solucoes/Ferramentas/Segmentos:**
```tsx
// Service schema
{ "@type": "Service", "provider": { "@type": "Organization", "name": "LK Digital" }, ... }
```

### Paginas Afetadas
| Pagina | Schema Recomendado |
|--------|--------------------|
| /casos | WebPage + ItemList |
| /contato | ContactPage |
| /faq | FAQPage |
| /privacidade | WebPage |
| /segmentos | Service |
| /sobre | Organization |
| /solucoes | Service |
| /termos | WebPage |
| /en, /en/about, /en/contact, /en/solutions, /en/tools | Mesmos schemas, hreflang |
| /fr, /fr/a-propos, /fr/contact, /fr/outils, /fr/solutions | Mesmos schemas, hreflang |

---

## PRIORIDADE 5: Titulo Muito Curto (1 pagina)
**Severidade:** Warning | **Impacto:** Baixo

| URL | Chars Atual | Sugestao |
|-----|-------------|----------|
| /termos | 26 | "Termos de Uso e Condicoes \| LK Digital" (39ch) |

---

## PLANO DE EXECUCAO (Ordem Recomendada)

### Sprint 1 (Impacto Maximo, Esforco Minimo)
1. Adicionar OG tags globais no layout.tsx (resolve 76 issues de uma vez)
2. Corrigir template de titulo do blog (remover/encurtar sufixo — resolve ~35 issues)
3. Corrigir template de titulo + meta description das cidades (resolve ~30 issues)

### Sprint 2
4. Reescrever manualmente os 5 titulos de blog mais longos
5. Corrigir meta descriptions das 7 paginas individuais
6. Corrigir titulos das paginas EN/FR e institucionais

### Sprint 3
7. Adicionar JSON-LD na pagina de FAQ (maior impacto de rich snippets)
8. Adicionar Organization schema no /sobre
9. Adicionar schemas nas demais 16 paginas

### Sprint 4
10. Reconectar Google Search Console no SEO Command Center
11. Rodar novo sync para ter dados de performance
12. Comparar metricas antes/depois das correcoes

---

## NOTA SOBRE O GOOGLE SEARCH CONSOLE

O GSC retornou 0 linhas de dados. Possiveis causas:
1. **OAuth nao completou** — O primeiro acesso deu erro. Tente reconectar em /sites/{id} clicando em "Conectar GSC"
2. **Propriedade incorreta** — Verifique se `gscPropertyUrl` no banco esta como `sc-domain:lkdigital.odo.br` (dominio) ou `https://lkdigital.odo.br/` (URL prefix), exatamente como aparece no GSC
3. **Site muito novo no GSC** — Se o site foi adicionado recentemente ao GSC, pode levar alguns dias para ter dados

Apos resolver isso e fazer um novo sync, o relatorio tera dados de keywords, posicoes, clicks e CTR para priorizar melhor.

---

*Relatorio gerado pelo SEO Command Center em 10/05/2026*
