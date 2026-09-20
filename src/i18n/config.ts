// The site's languages. The list itself is src/i18n/languages.json, the one file that the pages,
// astro.config.mjs and the scripts all read. The first entry is the default and the fallback.
// Adding a language: docs/i18n.md.
import languages from './languages.json';

export type Locale = keyof typeof languages;
export interface LocaleInfo { label: string; english: string; htmlLang: string; dir: 'ltr' | 'rtl'; og: string; match: string[] }

export const locales = languages as Record<Locale, LocaleInfo>;
export const localeCodes = Object.keys(languages) as Locale[];
export const defaultLocale: Locale = localeCodes[0];
export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && v in languages;
