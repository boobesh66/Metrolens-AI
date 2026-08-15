import en from '../../locales/en.json';
import ml from '../../locales/ml.json';
import { Language } from '../types';

export const translations = {
  en,
  ml,
};

export type TranslationKey = keyof typeof en;

// Fast, reliable client-side i18n lookup helper
export function t(path: string, lang: Language = 'en'): string {
  const dict = translations[lang] || translations.en;
  const keys = path.split('.');
  let current: any = dict;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      // Fallback to English if key is missing in chosen language
      let fallback: any = translations.en;
      for (const fKey of keys) {
        if (fallback && typeof fallback === 'object' && fKey in fallback) {
          fallback = fallback[fKey];
        } else {
          return path;
        }
      }
      return typeof fallback === 'string' ? fallback : path;
    }
  }

  return typeof current === 'string' ? current : path;
}
