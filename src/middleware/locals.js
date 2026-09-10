'use strict';

const site = require('../config/site');
const env = require('../config/env');
const { generateCsrfToken } = require('./security');
const settingsService = require('../services/settings.service');
const jsonld = require('../lib/jsonld');
const { formatPrice } = require('../lib/money');
const { formatDate, formatDateTime } = require('../lib/dates');

/**
 * Ustawia wspólne zmienne widoków (res.locals) dla każdego żądania.
 */
module.exports = function localsMiddleware(req, res, next) {
  const settings = settingsService.getSiteSettings();

  res.locals.site = site;
  res.locals.settings = settings;
  res.locals.env = { NODE_ENV: env.NODE_ENV };
  res.locals.currentPath = req.path;
  res.locals.currentUrl = site.baseUrl.replace(/\/$/, '') + req.originalUrl;
  res.locals.user = req.user || null;
  res.locals.isAdmin = !!(req.user && req.user.role === 'admin');
  res.locals.t = req.t || ((k) => k);
  res.locals.formatPrice = formatPrice;
  res.locals.formatDate = formatDate;
  res.locals.formatDateTime = formatDateTime;
  res.locals.year = new Date().getFullYear();
  res.locals.bodyClass = '';
  res.locals.script = '';
  res.locals.title = undefined;

  // CSRF token dostępny w każdym widoku (formularze)
  try {
    res.locals.csrfToken = generateCsrfToken(req, res);
  } catch (e) {
    if (env.NODE_ENV !== 'production') console.error('csrf token gen failed:', e.message);
    res.locals.csrfToken = '';
  }

  // Flash (jednorazowe komunikaty w sesji)
  if (req.session) {
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
  } else {
    res.locals.flash = null;
  }

  // Domyślne SEO — nadpisywane w widoku przez `seo`
  const localeShort = req.locale || 'pl';
  res.locals.seo = {
    title: null,
    description: (req.t && req.t('seo.defaultDescription')) || '',
    canonical: res.locals.alternateUrls
      ? res.locals.alternateUrls.find((a) => a.locale === localeShort)?.url
      : res.locals.currentUrl,
    ogType: 'website',
    ogImage: `${site.baseUrl}/img/og/default.jpg`,
    ogImageAlt: site.name,
    robots: 'index,follow',
    jsonld: [],
  };

  // Węzły JSON-LD wspólne dla całej witryny
  res.locals.baseJsonld = [jsonld.organization(settings), jsonld.website(localeShort)];

  // Analityka / piksele (renderowane tylko po zgodzie — patrz partials/analytics.ejs)
  res.locals.analytics = settings.analytics;

  // Zgody cookie z ciasteczka
  try {
    res.locals.consent = req.cookies?.nbg_consent ? JSON.parse(req.cookies.nbg_consent) : null;
  } catch {
    res.locals.consent = null;
  }

  next();
};
