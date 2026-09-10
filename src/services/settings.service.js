'use strict';

const db = require('../db');
const site = require('../config/site');
const env = require('../config/env');

const getStmt = db.prepare('SELECT value_json FROM settings WHERE key = ?');
const upsertStmt = db.prepare(`
  INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = datetime('now')
`);
const allStmt = db.prepare('SELECT key, value_json FROM settings');

let cache = null;

function get(key, fallback = null) {
  const row = getStmt.get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value_json);
  } catch {
    return fallback;
  }
}

function set(key, value) {
  upsertStmt.run(key, JSON.stringify(value));
  cache = null;
}

function all() {
  const out = {};
  for (const row of allStmt.all()) {
    try {
      out[row.key] = JSON.parse(row.value_json);
    } catch {
      out[row.key] = null;
    }
  }
  return out;
}

/**
 * Zwraca zmergowany obiekt ustawień witryny:
 * wartości z bazy nadpisują domyślne ze `site` / `.env`.
 */
function getSiteSettings() {
  if (cache) return cache;
  const stored = all();
  cache = {
    name: stored.business_name || site.name,
    tagline: stored.tagline || site.tagline,
    address: { ...site.address, ...(stored.address || {}) },
    contact: { ...site.contact, ...(stored.contact || {}) },
    social: { ...site.social, ...(stored.social || {}) },
    openingHours: stored.opening_hours || site.openingHours,
    serviceNotes: stored.service_notes || site.serviceNotes,
    analytics: {
      ga4: stored.analytics?.ga4 ?? env.GA4_MEASUREMENT_ID,
      gtm: stored.analytics?.gtm ?? env.GTM_CONTAINER_ID,
      metaPixel: stored.analytics?.metaPixel ?? env.META_PIXEL_ID,
      tiktokPixel: stored.analytics?.tiktokPixel ?? env.TIKTOK_PIXEL_ID,
      clarity: stored.analytics?.clarity ?? env.CLARITY_PROJECT_ID,
    },
    features: {
      shop: stored.features?.shop ?? true,
      reservations: stored.features?.reservations ?? true,
      newsletter: stored.features?.newsletter ?? true,
      instagram: stored.features?.instagram ?? true,
      ...(stored.features || {}),
    },
    reservationWidgetUrl: stored.reservation_widget_url || '',
    deliveryLinks: stored.delivery_links || {
      wolt: '',
      pyszne: '',
      ubereats: '',
    },
  };
  return cache;
}

function clearCache() {
  cache = null;
}

module.exports = { get, set, all, getSiteSettings, clearCache };
