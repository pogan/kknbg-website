'use strict';

const db = require('../db');
const { cleanHtml } = require('../lib/html');

const getStmt = db.prepare('SELECT * FROM content_blocks WHERE key = ? AND locale = ?');
const upsertStmt = db.prepare(`
  INSERT INTO content_blocks (key, locale, title, body_html, draft_html, format, updated_by, updated_at)
  VALUES (@key, @locale, @title, @body_html, @draft_html, @format, @updated_by, datetime('now'))
  ON CONFLICT(key, locale) DO UPDATE SET
    title = excluded.title,
    body_html = excluded.body_html,
    draft_html = excluded.draft_html,
    format = excluded.format,
    updated_by = excluded.updated_by,
    updated_at = datetime('now')
`);
const listStmt = db.prepare('SELECT key, locale, title, updated_at FROM content_blocks ORDER BY key, locale');

/** Publiczny render bloku: zwraca { title, html } albo domyślną treść. */
function block(key, locale = 'pl', defaults = {}) {
  const row = getStmt.get(key, locale) || getStmt.get(key, 'pl');
  if (!row) {
    return { key, locale, title: defaults.title || '', html: defaults.html || '', missing: true };
  }
  return { key, locale, title: row.title || defaults.title || '', html: row.body_html || defaults.html || '', updatedAt: row.updated_at };
}

function raw(key, locale = 'pl') {
  return getStmt.get(key, locale) || null;
}

function save({ key, locale, title, bodyHtml, draftHtml = null, format = 'html', userId = null, publish = true }) {
  const clean = cleanHtml(bodyHtml || '');
  upsertStmt.run({
    key,
    locale,
    title: title || '',
    body_html: publish ? clean : (raw(key, locale)?.body_html || ''),
    draft_html: publish ? null : cleanHtml(draftHtml || bodyHtml || ''),
    format,
    updated_by: userId,
  });
  return block(key, locale);
}

function list() {
  return listStmt.all();
}

module.exports = { block, raw, save, list };
