'use strict';

const express = require('express');
const menuService = require('../../services/menu.service');
const { csrfProtection } = require('../../middleware/security');
const { slugify } = require('../../lib/slug');
const db = require('../../db');

const router = express.Router();

function audit(userId, action, entityId, meta = {}) {
  db.prepare(`INSERT INTO audit_log (user_id, action, entity, entity_id, meta_json) VALUES (?, ?, 'menu', ?, ?)`)
    .run(userId, action, String(entityId), JSON.stringify(meta));
}

// Lista
router.get('/', (req, res) => {
  res.render('admin/menu-list', {
    layout: 'layouts/admin',
    title: 'Menu',
    menus: menuService.listAllForAdmin(),
    types: menuService.TYPE_LABELS,
  });
});

// Formularz nowego menu
router.get('/nowe', (req, res) => {
  res.render('admin/menu-edit', {
    layout: 'layouts/admin',
    title: 'Nowe menu',
    menu: { id: null, type: 'a_la_carte', locale: 'pl', title: '', intro: '', slug: '', status: 'draft', sections: [], revisions: [] },
    isNew: true,
    types: menuService.TYPE_LABELS,
  });
});

// Edycja
router.get('/:id', (req, res, next) => {
  const menu = menuService.getForAdmin(Number(req.params.id));
  if (!menu) return next();
  res.render('admin/menu-edit', {
    layout: 'layouts/admin',
    title: `Menu: ${menu.title}`,
    menu, isNew: false,
    types: menuService.TYPE_LABELS,
  });
});

// Zapis working state (create lub update)
router.post('/', csrfProtection, (req, res, next) => {
  try {
    const payload = parsePayload(req.body.payload);
    const data = {
      type: req.body.type, locale: req.body.locale || 'pl',
      slug: req.body.slug || slugify(req.body.title),
      title: req.body.title, intro: req.body.intro || '',
      sections: payload.sections || [],
    };
    const menu = menuService.createFromData(data, req.user.id, { publish: false });
    audit(req.user.id, 'menu.create', menu.id, { title: menu.title });
    req.session.flash = { type: 'success', text: 'Utworzono menu (wersja robocza). Opublikuj, gdy będzie gotowe.' };
    res.redirect(`/admin/menu/${menu.id}`);
  } catch (err) { next(err); }
});

router.post('/:id', csrfProtection, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = parsePayload(req.body.payload);
    menuService.saveWorking(id, {
      title: req.body.title, intro: req.body.intro,
      type: req.body.type, sections: payload.sections || [],
    }, req.user.id);
    audit(req.user.id, 'menu.save', id);
    req.session.flash = { type: 'success', text: 'Zapisano zmiany (wersja robocza).' };
    res.redirect(`/admin/menu/${id}`);
  } catch (err) { next(err); }
});

// Publikacja -> nowa rewizja
router.post('/:id/publikuj', csrfProtection, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const r = menuService.publish(id, req.user.id, req.body.note || '');
    audit(req.user.id, 'menu.publish', id, { version: r.version });
    req.session.flash = { type: 'success', text: `Opublikowano wersję ${r.version}.` };
    res.redirect(`/admin/menu/${id}`);
  } catch (err) { next(err); }
});

// Rollback do rewizji
router.post('/:id/przywroc/:revId', csrfProtection, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const r = menuService.rollback(id, Number(req.params.revId), req.user.id);
    audit(req.user.id, 'menu.rollback', id, { toRevision: req.params.revId, newVersion: r.version });
    req.session.flash = { type: 'success', text: `Przywrócono treść i opublikowano jako wersję ${r.version}.` };
    res.redirect(`/admin/menu/${id}`);
  } catch (err) { next(err); }
});

// Status (archiwizacja / przywrócenie do draft)
router.post('/:id/status', csrfProtection, (req, res) => {
  const id = Number(req.params.id);
  const status = ['draft', 'published', 'archived'].includes(req.body.status) ? req.body.status : 'draft';
  menuService.setStatus(id, status);
  audit(req.user.id, 'menu.status', id, { status });
  req.session.flash = { type: 'success', text: `Zmieniono status na „${status}".` };
  res.redirect('/admin/menu');
});

router.post('/:id/usun', csrfProtection, (req, res) => {
  const id = Number(req.params.id);
  menuService.remove(id);
  audit(req.user.id, 'menu.delete', id);
  req.session.flash = { type: 'success', text: 'Usunięto menu.' };
  res.redirect('/admin/menu');
});

// Podgląd rewizji (JSON)
router.get('/:id/wersja/:revId', (req, res, next) => {
  const rev = menuService.getRevision(Number(req.params.revId));
  if (!rev || rev.menu_id !== Number(req.params.id)) return next();
  res.json(rev.snapshot);
});

function parsePayload(raw) {
  if (!raw) return { sections: [] };
  try {
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { sections: Array.isArray(p.sections) ? p.sections : [] };
  } catch {
    return { sections: [] };
  }
}

module.exports = router;
