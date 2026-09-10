'use strict';

const express = require('express');
const content = require('../../services/content.service');
const { csrfProtection } = require('../../middleware/security');
const db = require('../../db');

const router = express.Router();

// Lista bloków — grupowana po kluczu
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, locale, title, updated_at FROM content_blocks ORDER BY key, locale').all();
  const grouped = {};
  for (const r of rows) {
    (grouped[r.key] = grouped[r.key] || { key: r.key, locales: {} });
    grouped[r.key].locales[r.locale] = r;
  }
  res.render('admin/content-list', { layout: 'layouts/admin', title: 'Treść stron', groups: Object.values(grouped) });
});

// Edytor bloku
router.get('/:key/:locale', (req, res, next) => {
  const { key, locale } = req.params;
  const block = content.raw(key, locale);
  if (!block && !['pl', 'en'].includes(locale)) return next();
  res.render('admin/content-edit', {
    layout: 'layouts/admin',
    title: `Treść: ${key}`,
    key, locale,
    block: block || { key, locale, title: '', body_html: '' },
  });
});

// Zapis z formularza edytora
router.post('/:key/:locale', csrfProtection, (req, res) => {
  const { key, locale } = req.params;
  content.save({
    key, locale,
    title: req.body.title,
    bodyHtml: req.body.body_html,
    userId: req.user.id,
    publish: true,
  });
  db.prepare(`INSERT INTO audit_log (user_id, action, entity, entity_id, meta_json)
    VALUES (?, 'content.save', 'content_block', ?, ?)`).run(req.user.id, `${key}:${locale}`, '{}');
  req.session.flash = { type: 'success', text: 'Zapisano treść.' };
  res.redirect('/admin/tresc');
});

// Inline-edit ze strony publicznej (fetch z app.js)
router.post('/inline', express.json(), csrfProtection, (req, res) => {
  const { key, locale, bodyHtml } = req.body || {};
  if (!key || !locale) return res.status(400).json({ ok: false, error: 'Brak key/locale' });
  const saved = content.save({ key, locale, title: content.raw(key, locale)?.title || '', bodyHtml, userId: req.user.id, publish: true });
  res.json({ ok: true, html: saved.html });
});

module.exports = router;
