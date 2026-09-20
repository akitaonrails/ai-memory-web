// schema.org structured data. Base.astro builds the site-wide graph; pages add their own objects through
// the `schema` prop, usually with faqPage().
import { site } from '@/data/site';

export interface Faq { q: string; a: string }

/** FAQPage from the same question list the page renders. Answers may hold inline HTML; search engines want text. */
export const faqPage = (items: readonly Faq[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
  })),
});

interface Crumb { name: string; url: string }
interface GraphInput {
  home: string; canonical: string; htmlLang: string; tagline: string; description: string; fullTitle: string;
  version?: string; crumbs: Crumb[]; extra: Record<string, unknown>[];
}

export function siteGraph({ home, canonical, htmlLang, tagline, description, fullTitle, version, crumbs, extra }: GraphInput) {
  const author = { '@id': `${home}#author` };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${home}#site`, url: home, name: site.name, description: tagline, inLanguage: htmlLang, publisher: author },
      { '@type': 'Person', ...author, name: site.author, url: site.authorUrl },
      {
        '@type': 'SoftwareApplication', '@id': `${home}#software`, name: site.name, description, url: home,
        applicationCategory: 'DeveloperApplication', operatingSystem: 'Linux, macOS, Windows',
        softwareVersion: version, license: 'https://opensource.org/license/mit',
        codeRepository: site.repo, downloadUrl: `${site.repo}/releases/latest`, author,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      { '@type': 'WebPage', '@id': `${canonical}#page`, url: canonical, name: fullTitle, description, inLanguage: htmlLang, isPartOf: { '@id': `${home}#site` }, about: { '@id': `${home}#software` } },
      ...(crumbs.length > 1
        ? [{ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) }]
        : []),
      ...extra,
    ],
  };
}
