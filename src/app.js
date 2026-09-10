'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');

const env = require('./config/env');
const db = require('./db');
const { i18next, middleware: i18nextMiddleware } = require('./config/i18n');
const passport = require('./config/passport');

const localeMiddleware = require('./middleware/locale');
const localsMiddleware = require('./middleware/locals');
const { helmetMiddleware, generalLimiter } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  db.applySchema();

  const app = express();
  app.set('trust proxy', 1);

  // Widoki
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/base');
  app.set('layout extractScripts', false);
  app.set('layout extractStyles', false);

  // Bezpieczeństwo + kompresja + logi
  app.use(helmetMiddleware());
  app.use(compression());
  if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Statyki
  app.use(
    express.static(path.join(__dirname, '..', 'public'), {
      maxAge: env.NODE_ENV === 'production' ? '7d' : 0,
      etag: true,
    }),
  );

  // Parsery
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(env.SESSION_SECRET));

  // Sesje
  app.use(
    session({
      store: new SQLiteStore({ db: 'sessions.sqlite', dir: db.DATA_DIR, concurrentDB: true }),
      name: 'nbg.sid',
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.COOKIE_SECURE,
        maxAge: 1000 * 60 * 60 * 24 * 14,
      },
    }),
  );

  // Auth
  app.use(passport.initialize());
  app.use(passport.session());

  // i18n + locale routing (locale MUSI być przed i18next, bo ustawia req.detectedLocale)
  app.use(localeMiddleware);
  app.use(i18nextMiddleware.handle(i18next));

  // Rate limiting (po sesjach, przed trasami)
  app.use(generalLimiter);

  // Wspólne zmienne widoków
  app.use(localsMiddleware);

  // --- Trasy ------------------------------------------------------------
  app.use('/auth', require('./routes/auth'));
  app.use('/', require('./routes/og'));
  app.use('/', require('./routes/sitemap'));
  app.use('/', require('./routes/shop'));
  app.use('/admin', require('./routes/admin'));
  app.use('/', require('./routes/public'));

  // Health-check
  app.get('/healthz', (req, res) => res.json({ ok: true, ts: Date.now() }));

  // Błędy
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
