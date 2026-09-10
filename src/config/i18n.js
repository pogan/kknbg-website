'use strict';

const path = require('path');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

const LOCALES = ['pl', 'en'];

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'pl',
    supportedLngs: LOCALES,
    preload: LOCALES,
    ns: ['common'],
    defaultNS: 'common',
    backend: {
      loadPath: path.join(__dirname, '..', '..', 'locales', '{{lng}}.json'),
    },
    detection: {
      // Kolejność: to co ustawi middleware locale.js w req (via 'path'), potem cookie
      order: ['customLocale', 'cookie', 'header'],
      lookupCookie: 'nbg_lang',
      caches: ['cookie'],
    },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

// Własny detektor: czyta req.detectedLocale ustawione przez middleware/locale.js
i18next.services.languageDetector.addDetector({
  name: 'customLocale',
  lookup(req) {
    return req && req.detectedLocale;
  },
  cacheUserLanguage() {},
});

module.exports = { i18next, middleware, LOCALES };
