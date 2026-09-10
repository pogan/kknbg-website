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
function allAdmin() {
  return db.prepare(`SELECT p.*, m.path AS media_path FROM promotions p
    LEFT JOIN media m ON m.id = p.media_id ORDER BY p.kind, p.weekday, p.position, p.id`).all();
}
function get(id) {
  return byId.get(id);
}

const insertStmt = db.prepare(`INSERT INTO promotions
  (locale, kind, weekday, title, short_label, description, media_id, starts_at, ends_at, is_active, position)
  VALUES (@locale, @kind, @weekday, @title, @short_label, @description, @media_id, @starts_at, @ends_at, @is_active, @position)`);
const updateStmt = db.prepare(`UPDATE promotions SET
  locale=@locale, kind=@kind, weekday=@weekday, title=@title, short_label=@short_label,
  description=@description, media_id=@media_id, starts_at=@starts_at, ends_at=@ends_at,
  is_active=@is_active, position=@position WHERE id=@id`);
const deleteStmt = db.prepare('DELETE FROM promotions WHERE id = ?');
const toggleStmt = db.prepare('UPDATE promotions SET is_active = NOT is_active WHERE id = ?');

function normalize(body) {
  const kind = body.kind === 'weekly' ? 'weekly' : 'timed';
  return {
    locale: body.locale === 'en' ? 'en' : 'pl',
    kind,
    weekday: kind === 'weekly' && body.weekday ? Number(body.weekday) : null,
    title: String(body.title || '').trim(),
    short_label: String(body.short_label || '').trim(),
    description: String(body.description || '').trim(),
    media_id: body.media_id ? Number(body.media_id) : null,
    starts_at: kind === 'timed' && body.starts_at ? body.starts_at : null,
    ends_at: kind === 'timed' && body.ends_at ? body.ends_at : null,
    is_active: body.is_active === 'on' || body.is_active === '1' || body.is_active === true ? 1 : 0,
    position: Number(body.position) || 0,
  };
}

function create(body) {
  return insertStmt.run(normalize(body)).lastInsertRowid;
}
function update(id, body) {
  updateStmt.run({ ...normalize(body), id: Number(id) });
}
function remove(id) {
  deleteStmt.run(Number(id));
}
function toggle(id) {
  toggleStmt.run(Number(id));
}

module.exports = { weekly, liveTimed, forPublic, highlight, all, allAdmin, get, create, update, remove, toggle };
