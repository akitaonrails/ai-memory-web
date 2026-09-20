// Message lookup with English fallback, locale-aware links, and the static paths every page uses.
//
//   const { t, raw, href, locale } = useI18n(Astro, 'install');
//   t('hero.title')                  string from install.json, else common.json, else the English one
//   t('stats.people', { n: 97 })     "{n}" placeholders
//   raw<Step[]>('solo.steps')        arrays and objects, merged with English so a missing item falls back
//   href('/install/#team')           "/pt-br/install/#team" on the Portuguese site
//
// Messages may contain inline HTML (<code>, <a>, <strong>); render those with set:html.
import type { AstroGlobal } from 'astro';
import { defaultLocale, isLocale, localeCodes, locales, type Locale } from './config';

type Tree = { [k: string]: Tree | string | Tree[] | string[] };
const files = import.meta.glob<{ default: Tree }>('./locales/*/*.json', { eager: true });

const catalogs: Record<string, Record<string, Tree>> = {};
for (const [path, mod] of Object.entries(files)) {
  const [, locale, ns] = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/)!;
  (catalogs[locale] ??= {})[ns] = mod.default;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Locale value over English value, key by key, so an untranslated key shows English instead of nothing. */
function merge(base: unknown, over: unknown): unknown {
  if (over === undefined || over === null || over === '') return base;
  if (Array.isArray(base) && Array.isArray(over)) return base.map((b, i) => merge(b, over[i]));
  if (isObj(base) && isObj(over)) return Object.fromEntries(Object.keys(base).map((k) => [k, merge(base[k], over[k])]));
  return over;
}

const dig = (tree: unknown, key: string) => key.split('.').reduce<unknown>((o, k) => (isObj(o) || Array.isArray(o) ? (o as any)[k] : undefined), tree);

const merged = new Map<string, unknown>();
function catalog(locale: Locale, ns: string) {
  const id = `${locale}/${ns}`;
  if (!merged.has(id)) merged.set(id, merge(catalogs[defaultLocale]?.[ns] ?? {}, locale === defaultLocale ? undefined : catalogs[locale]?.[ns]));
  return merged.get(id);
}

export function localeFrom(astro: Pick<AstroGlobal, 'currentLocale' | 'params'>): Locale {
  const fromParam = astro.params?.locale;
  if (isLocale(fromParam)) return fromParam;
  return isLocale(astro.currentLocale) ? astro.currentLocale : defaultLocale;
}

/** "/install/" -> "/ja/install/". External links, mailto:, and bare "#anchors" pass through. */
export function localizePath(locale: Locale, path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const bare = stripLocale(path);
  return locale === defaultLocale ? bare : `/${locale}${bare}`;
}

export function stripLocale(path: string): string {
  const seg = path.split('/')[1];
  return isLocale(seg) && seg !== defaultLocale ? path.slice(seg.length + 1) || '/' : path;
}

export function useI18n(astro: Pick<AstroGlobal, 'currentLocale' | 'params'>, ...namespaces: string[]) {
  const locale = localeFrom(astro);
  const spaces = [...namespaces, 'common'];

  function raw<T = unknown>(key: string): T {
    for (const ns of spaces) {
      const hit = dig(catalog(locale, ns), key);
      if (hit !== undefined) return hit as T;
    }
    // A missing key is a bug in the page, never a translation gap (those fall back to English above).
    throw new Error(`[i18n] missing key "${key}" in ${spaces.join(', ')}`);
  }

  function t(key: string, params?: Record<string, string | number>): string {
    const msg = raw<string>(key);
    if (typeof msg !== 'string') throw new Error(`[i18n] "${key}" is not a string; use raw()`);
    return params ? msg.replace(/\{(\w+)\}/g, (m, p) => (p in params ? String(params[p]) : m)) : msg;
  }

  const meta = locales[locale];
  return {
    t, raw, locale, dir: meta.dir, htmlLang: meta.htmlLang,
    href: (path: string) => localizePath(locale, path),
    /** Dates and numbers in the reader's conventions. */
    date: (iso: string | null, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }) =>
      iso ? new Date(iso).toLocaleDateString(meta.htmlLang, { timeZone: 'UTC', ...opts }) : '',
    number: (n: number) => n.toLocaleString(meta.htmlLang),
  };
}

/** Every page lives under src/pages/[...locale]/ and exports this as getStaticPaths. English has no prefix. */
export const localePaths = () => localeCodes.map((l) => ({ params: { locale: l === defaultLocale ? undefined : l } }));
