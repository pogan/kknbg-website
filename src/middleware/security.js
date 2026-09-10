'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { doubleCsrf } = require('csrf-csrf');
const env = require('../config/env');

// --- Helmet / CSP ---------------------------------------------------------
// CSP dopasowany do prototypu: Leaflet z unpkg, kafelki OSM, obrazy inline.
const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // prototyp: drobne inline snippety (analytics loader, JSON-LD)
      'https://unpkg.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://connect.facebook.net',
      'https://analytics.tiktok.com',
      'https://www.clarity.ms',
    ],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org', 'https://unpkg.com', 'https://www.google-analytics.com', 'https://*.facebook.com'],
    connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://analytics.google.com', 'https://*.tile.openstreetmap.org', 'https://www.clarity.ms'],
    frameSrc: ["'self'", 'https://www.google.com', 'https://www.facebook.com'],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'self'"],
    upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
  },
};

function helmetMiddleware() {
  return helmet({
    contentSecurityPolicy,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

// --- Rate limiting -------------------------------------------------------
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/uploads') || req.path.startsWith('/css') || req.path.startsWith('/js'),
});

const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.',
  standardHeaders: true,
  legacyHeaders: false,
});

// --- CSRF (double submit cookie) ---------------------------------------
const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.SESSION_SECRET,
  getSessionIdentifier: (req) => req.sessionID || req.ip,
  cookieName: env.COOKIE_SECURE ? '__Host-nbg.x-csrf' : 'nbg.x-csrf',
  cookieOptions: {
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    httpOnly: true,
    path: '/',
  },
  size: 32,
  getTokenFromRequest: (req) =>
    (req.body && req.body._csrf) || req.headers['x-csrf-token'] || (req.query && req.query._csrf),
});

// Zawsze nadpisuj token/cookie (identyfikator sesji zmienia się po zalogowaniu,
// co przy walidacji reuse rzucałoby "invalid csrf token").
function generateCsrfToken(req, res) {
  return generateToken(req, res, true, false); // overwrite=true, validateOnReuse=false
}

module.exports = {
  helmetMiddleware,
  generalLimiter,
  formLimiter,
  csrfProtection: doubleCsrfProtection,
  generateCsrfToken,
};
