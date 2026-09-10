'use strict';

require('dotenv').config();

const { cleanEnv, str, port, bool, num, url } = require('envalid');

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),
  BASE_URL: url({ default: 'http://localhost:3000' }),

  SESSION_SECRET: str({ default: 'dev-insecure-secret-change-me' }),
  COOKIE_SECURE: bool({ default: false }),

  AUTH_MODE: str({ choices: ['mock', 'google'], default: 'mock' }),
  ADMIN_EMAILS: str({ default: 'karol.konop@gmail.com' }),
  GOOGLE_CLIENT_ID: str({ default: '' }),
  GOOGLE_CLIENT_SECRET: str({ default: '' }),
  GOOGLE_CALLBACK_URL: str({ default: 'http://localhost:3000/auth/google/callback' }),

  PAYMENTS_PROVIDER: str({ choices: ['mock', 'autopay', 'przelewy24', 'payu', 'stripe'], default: 'mock' }),
  PAYMENTS_CURRENCY: str({ default: 'PLN' }),

  MAILER: str({ choices: ['outbox', 'smtp', 'resend', 'brevo'], default: 'outbox' }),
  MAIL_FROM: str({ default: 'Nowy Browar Gdański <no-reply@nowybrowargdanski.pl>' }),
  MAIL_TO_CONTACT: str({ default: 'kontakt@nowybrowargdanski.pl' }),
  MAIL_TO_B2B: str({ default: 'handel@nowybrowargdanski.pl' }),
  MAIL_TO_SHOP: str({ default: 'sklep@nowybrowargdanski.pl' }),

  GA4_MEASUREMENT_ID: str({ default: '' }),
  GTM_CONTAINER_ID: str({ default: '' }),
  META_PIXEL_ID: str({ default: '' }),
  TIKTOK_PIXEL_ID: str({ default: '' }),
  CLARITY_PROJECT_ID: str({ default: '' }),

  BUSINESS_NAME: str({ default: 'Nowy Browar Gdański' }),
  BUSINESS_STREET: str({ default: 'ul. Jana Kilińskiego 7E' }),
  BUSINESS_POSTAL: str({ default: '80-452' }),
  BUSINESS_CITY: str({ default: 'Gdańsk' }),
  BUSINESS_PHONE: str({ default: '+48 731 707 177' }),
  BUSINESS_LAT: num({ default: 54.38228 }),
  BUSINESS_LNG: num({ default: 18.60130 }),

  UPLOAD_MAX_MB: num({ default: 25 }),
  RATE_LIMIT_WINDOW_MIN: num({ default: 15 }),
  RATE_LIMIT_MAX: num({ default: 300 }),
});

const ADMIN_EMAIL_LIST = env.ADMIN_EMAILS
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// envalid zwraca obiekt tylko do odczytu — eksportujemy przez proxy z dodatkiem.
module.exports = new Proxy(env, {
  get(target, prop) {
    if (prop === 'ADMIN_EMAIL_LIST') return ADMIN_EMAIL_LIST;
    return target[prop];
  },
});
