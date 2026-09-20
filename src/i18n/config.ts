// The one place that lists the site's languages. Adding a language: add an entry here,
// add it to astro.config.mjs, and create src/i18n/locales/<code>/. See docs/i18n.md.
export const defaultLocale = 'en';

export const locales = {
  en: { label: 'English', htmlLang: 'en', dir: 'ltr', og: 'en_US', match: ['en'] },
  'pt-br': { label: 'Português (Brasil)', htmlLang: 'pt-BR', dir: 'ltr', og: 'pt_BR', match: ['pt'] },
  es: { label: 'Español', htmlLang: 'es', dir: 'ltr', og: 'es_ES', match: ['es'] },
  he: { label: 'עברית', htmlLang: 'he', dir: 'rtl', og: 'he_IL', match: ['he', 'iw'] },
  ja: { label: '日本語', htmlLang: 'ja', dir: 'ltr', og: 'ja_JP', match: ['ja'] },
} as const;

export type Locale = keyof typeof locales;
export const localeCodes = Object.keys(locales) as Locale[];
export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && v in locales;
