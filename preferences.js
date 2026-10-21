import { normalizeLanguage } from './i18n.js?v=11';
export const normalizeCountry = value => /^[a-z]{2}$/i.test(String(value || '')) ? String(value).toUpperCase() : '';
export function browserCountry(locales) {
  for (const locale of locales) {
    try {
      const region = new Intl.Locale(locale).region;
      if (normalizeCountry(region)) return region;
    } catch {}
  }
  return '';
}
// Link parameters supplied by a native app take priority over saved preferences.
export function resolvePreferences(href, saved = {}, browserLanguages = ['en-US'], browserLocale = '') {
  const url = new URL(href);
  const language = normalizeLanguage(url.searchParams.get('lang'))
    || normalizeLanguage(saved.language)
    || browserLanguages.map(normalizeLanguage).find(Boolean) || 'en';
  const country = normalizeCountry(url.searchParams.get('country'))
    || browserCountry([...browserLanguages, browserLocale]);
  url.searchParams.set('lang', language);
  if (country) url.searchParams.set('country', country);
  else url.searchParams.delete('country');
  return { language, country, url };
}
export function updatePreferenceURL(href, language, country) {
  const url = new URL(href);
  url.searchParams.set('lang', normalizeLanguage(language) || 'en');
  if (normalizeCountry(country)) url.searchParams.set('country', normalizeCountry(country));
  else url.searchParams.delete('country');
  return url;
}
