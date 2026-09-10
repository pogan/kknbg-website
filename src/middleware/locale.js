'use strict';

const site = require('../config/site');

const LOCALES = site.locales;
const DEFAULT = site.defaultLocale;

/**
 * Routing językowy oparty o prefiks ścieżki:
 *   /            -> pl (domyślny, bez prefiksu — lepszy dla SEO w PL)
 *   /en          -> en
 *   /en/menu     -> en, ścieżka wewnętrzna /menu
 *
 * Ustawia:
 *   req.detectedLocale        — dla i18next
 *   req.locale                — 'pl' | 'en'
 *   res.locals.locale
 *   res.locals.localePath(p)  — helper budujący URL w bieżącym języku
 *   res.locals.altLocaleUrl   — URL bieżącej strony w drugim języku (hreflang / switcher)
 */
module.exports = function localeMiddleware(req, res, next) {
  let locale = DEFAULT;
  let internalPath = req.path;

  const m = req.path.match(/^\/([a-z]{2})(\/|$)/i);
  if (m && LOCALES.includes(m[1].toLowerCase()) && m[1].toLowerCase() !== DEFAULT) {
    locale = m[1].toLowerCase();
    // przepisz URL tak, by dalszy routing nie widział prefiksu
    req.url = req.url.slice(3) || '/';
    internalPath = req.path;
  }

  req.locale = locale;
  req.detectedLocale = locale;

  const prefix = locale === DEFAULT ? '' : `/${locale}`;

  res.locals.locale = locale;
  res.locals.locales = LOCALES;
  res.locals.defaultLocale = DEFAULT;

  res.locals.localePath = (p = '/', targetLocale = locale) => {
    const clean = String(p).startsWith('/') ? p : `/${p}`;
    const tp = targetLocale === DEFAULT ? '' : `/${targetLocale}`;
    return (tp + clean).replace(/\/$/, '') || '/';
  };

  // URL tej samej strony w pozostałych językach — do <link rel="alternate">
  res.locals.alternateUrls = LOCALES.map((lng) => ({
    locale: lng,
    url:
      site.baseUrl.replace(/\/$/, '') +
      ((lng === DEFAULT ? '' : `/${lng}`) + internalPath).replace(/\/$/, ''),
  }));
  res.locals.currentPrefix = prefix;
  res.locals.internalPath = internalPath;

  next();
};
