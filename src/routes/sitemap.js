'use strict';

const express = require('express');
const site = require('../config/site');
const env = require('../config/env');

const router = express.Router();
const BASE = site.baseUrl.replace(/\/$/, '');

// Ścieżki publiczne do mapy witryny (rozszerzane dynamicznie przez moduły).
const STATIC_PATHS = [
  '/', '/o-browarze', '/menu', '/piwa', '/promocje', '/oferta-dla-grup',
  '/sport', '/wspolpraca-b2b', '/kontakt', '/lokalizacja', '/wydarzenia',
  '/social', '/sklep', '/regulamin', '/regulamin-sklepu', '/polityka-prywatnosci',
];

let dynamicProviders = [];
/** Moduł (menu, sklep) rejestruje funkcję zwracającą [{ path, lastmod, changefreq, priority }]. */
function registerSitemapProvider(fn) {
  dynamicProviders.push(fn);
}

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    [
      'User-agent: *',
      env.NODE_ENV === 'production' ? 'Allow: /' : 'Disallow: /',
      'Disallow: /admin',
      'Disallow: /auth',
      'Disallow: /koszyk',
      'Disallow: /zamowienie',
      `Sitemap: ${BASE}/sitemap.xml`,
      '',
    ].join('\n'),
  );
});

router.get('/sitemap.xml', (req, res) => {
  const entries = [];
  for (const p of STATIC_PATHS) {
    for (const loc of site.locales) {
      const prefix = loc === site.defaultLocale ? '' : `/${loc}`;
      entries.push({
        loc: `${BASE}${prefix}${p}`.replace(/\/$/, '') || BASE,
        alternates: site.locales.map((l) => ({
          hreflang: l,
          href: `${BASE}${l === site.defaultLocale ? '' : `/${l}`}${p}`.replace(/\/$/, '') || BASE,
        })),
        changefreq: p === '/' ? 'daily' : 'weekly',
        priority: p === '/' ? '1.0' : '0.7',
      });
    }
  }
  for (const provider of dynamicProviders) {
    try {
      for (const item of provider() || []) {
        entries.push({
          loc: `${BASE}${item.path}`,
          changefreq: item.changefreq || 'weekly',
          priority: item.priority || '0.6',
          lastmod: item.lastmod,
        });
      }
    } catch (e) {
      /* ignoruj błędy providerów w sitemap */
    }
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries
      .map(
        (e) =>
          `  <url>\n    <loc>${e.loc}</loc>\n` +
          (e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>\n` : '') +
          `    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n` +
          (e.alternates
            ? e.alternates
                .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>\n`)
                .join('')
            : '') +
          '  </url>',
      )
      .join('\n') +
    '\n</urlset>\n';

  res.type('application/xml').send(xml);
});

router.get('/manifest.webmanifest', (req, res) => {
  res.type('application/manifest+json').json({
    name: site.name,
    short_name: 'NBG',
    description: site.tagline.pl,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f4ef',
    theme_color: '#1c1a17',
    lang: 'pl',
    icons: [
      { src: '/img/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/img/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    shortcuts: [
      { name: 'Menu', url: '/menu' },
      { name: 'Rezerwacja', url: '/kontakt#rezerwacja' },
      { name: 'Sklep', url: '/sklep' },
    ],
  });
});

module.exports = router;
module.exports.registerSitemapProvider = registerSitemapProvider;
