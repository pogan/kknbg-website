'use strict';

const db = require('../db');
const { isPromoLive } = require('../lib/dates');

const listAll = db.prepare(`SELECT p.*, m.path AS media_path FROM promotions p
  LEFT JOIN media m ON m.id = p.media_id
  WHERE p.locale = ? ORDER BY p.kind, p.weekday, p.position, p.id`);
const byId = db.prepare('SELECT * FROM promotions WHERE id = ?');

function weekly(locale = 'pl') {
  return listAll.all(locale).filter((p) => p.kind === 'weekly' && p.is_active);
}

function liveTimed(locale = 'pl') {
  return listAll.all(locale).filter((p) => p.kind === 'timed' && isPromoLive(p));
}

/** Wszystko do strony /promocje. */
function forPublic(locale = 'pl') {
  return { weekly: weekly(locale), timed: liveTimed(locale) };
}

/** Najważniejsza promocja na baner (dzisiejsze promo dnia lub pierwsza aktywna czasowa). */
function highlight(locale = 'pl') {
  const timed = liveTimed(locale);
  if (timed.length) return timed[0];
  const now = new Date();
  const isoDow = now.getDay() === 0 ? 7 : now.getDay();
  return weekly(locale).find((p) => p.weekday === isoDow) || null;
}

function all(locale = 'pl') {
  return listAll.all(locale);
}
function get(id) {
  return byId.get(id);
}

module.exports = { weekly, liveTimed, forPublic, highlight, all, get };
