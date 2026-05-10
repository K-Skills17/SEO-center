import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateSiteOverview(params: {
  siteName: string;
  domain: string;
  healthScore: number;
  totalIssues: number;
  criticalIssues: number;
  topIssues: Array<{
    title: string;
    category: string;
    severity: string;
    affectedUrl?: string;
  }>;
  topKeywords: Array<{
    query: string;
    position: number;
    clicks: number;
    impressions: number;
  }>;
  topPages: Array<{ url: string; clicks: number; ctr: number }>;
}): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const prompt = `You are an expert SEO strategist analyzing a website's SEO health data.

SITE: ${params.siteName} (${params.domain})
HEALTH SCORE: ${params.healthScore}/100
TOTAL ISSUES: ${params.totalIssues} (${params.criticalIssues} critical)

TOP ISSUES:
${params.topIssues.map((i) => `- [${i.severity.toUpperCase()}] ${i.title} ${i.affectedUrl ? `on ${i.affectedUrl}` : ''}`).join('\n')}

TOP KEYWORDS (by impressions):
${params.topKeywords.map((k) => `- "${k.query}" → pos ${k.position.toFixed(1)}, ${k.clicks} clicks, ${k.impressions} impressions`).join('\n')}

TOP PAGES (by clicks):
${params.topPages.map((p) => `- ${p.url} → ${p.clicks} clicks, ${(p.ctr * 100).toFixed(1)}% CTR`).join('\n')}

Provide a strategic SEO analysis in Portuguese (Brazil) with:
1. **Diagnostico Geral** (2-3 sentences on overall health)
2. **Prioridades Imediatas** (top 3 actions, most impactful first)
3. **Oportunidades de Crescimento** (2-3 keyword/content opportunities)
4. **O que esta funcionando** (1-2 genuine positives to acknowledge)

Be direct, specific, and actionable. No generic advice. Reference actual data from the numbers above.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content =
    response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    content,
    promptTokens: response.usage.input_tokens,
    completionTokens: response.usage.output_tokens,
  };
}

export async function generateIssueFix(params: {
  issue: {
    title: string;
    description: string;
    issueType: string;
    affectedUrl?: string | null;
    affectedQuery?: string | null;
  };
  crawlData?: {
    title?: string | null;
    titleLength?: number;
    metaDescription?: string | null;
    metaDescriptionLength?: number;
    h1s?: string[];
  };
  gscData?: {
    query: string;
    position: number;
    impressions: number;
    ctr: number;
  };
  siteName: string;
}): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const prompt = `You are an expert Next.js SEO engineer. Provide a specific, implementable fix for this SEO issue.

SITE: ${params.siteName}
ISSUE: ${params.issue.title}
DESCRIPTION: ${params.issue.description}
AFFECTED URL: ${params.issue.affectedUrl || 'N/A'}
${params.issue.affectedQuery ? `AFFECTED QUERY: "${params.issue.affectedQuery}"` : ''}

${
  params.crawlData
    ? `CURRENT PAGE DATA:
- Title: "${params.crawlData.title || 'MISSING'}" (${params.crawlData.titleLength} chars)
- Meta Description: "${params.crawlData.metaDescription || 'MISSING'}" (${params.crawlData.metaDescriptionLength} chars)
- H1s: ${params.crawlData.h1s?.join(' | ') || 'NONE'}`
    : ''
}

${
  params.gscData
    ? `GSC DATA:
- Position: ${params.gscData.position}
- Impressions: ${params.gscData.impressions}
- CTR: ${(params.gscData.ctr * 100).toFixed(2)}%`
    : ''
}

Provide a response in Portuguese (Brazil) with:
1. **Por que isso importa** (1 sentence explaining the ranking/traffic impact)
2. **Como corrigir** (step-by-step fix with actual Next.js code)
3. **Exemplo reescrito** (if applicable: rewrite the title/description/content with the exact query "${params.issue.affectedQuery || ''}" integrated naturally)
4. **Resultado esperado** (what metric improvement to expect)

Write actual, copy-paste-ready Next.js code. Be ultra-specific.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const content =
    response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    content,
    promptTokens: response.usage.input_tokens,
    completionTokens: response.usage.output_tokens,
  };
}
