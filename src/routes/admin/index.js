'use strict';

const express = require('express');
const { ensureAdmin } = require('../../middleware/auth');
const db = require('../../db');
const inquiries = require('../../services/inquiry.service');

const router = express.Router();

// Panel administracyjny jest zawsze noindex.
router.use((req, res, next) => {
  res.locals.seo = { ...(res.locals.seo || {}), robots: 'noindex,nofollow' };
  const counts = safeCounts();
  res.locals.adminNav = [
    { label: 'Pulpit', path: '/admin' },
    { label: 'Treść stron', path: '/admin/tresc' },
    { label: 'Menu', path: '/admin/menu' },
    { label: 'Import PDF', path: '/admin/import-pdf' },
    { label: 'Promocje', path: '/admin/promocje' },
    { label: 'Sklep — produkty', path: '/admin/produkty' },
    { label: 'Sklep — zamówienia', path: '/admin/zamowienia' },
    { label: 'Media', path: '/admin/media' },
    { label: 'Zapytania', path: '/admin/zapytania' },
    { label: 'Skrzynka (outbox)', path: '/admin/outbox' },
    { label: 'Ustawienia', path: '/admin/ustawienia' },
  ];
  res.locals.badges = {
    '/admin/zapytania': counts.total || '',
    '/admin/zamowienia': counts.orders || '',
  };
  next();
});

router.use(ensureAdmin);

router.get('/', (req, res) => {
  res.render('admin/dashboard', {
    layout: 'layouts/admin',
    title: 'Pulpit',
    stats: {
      menus: one('SELECT COUNT(*) n FROM menus'),
      promotions: one("SELECT COUNT(*) n FROM promotions WHERE is_active = 1"),
      products: one("SELECT COUNT(*) n FROM products WHERE is_active = 1"),
      newInquiries: one("SELECT COUNT(*) n FROM inquiries WHERE status = 'new'"),
      orders: one("SELECT COUNT(*) n FROM orders"),
    },
    recentInquiries: inquiries.recent(null, 8),
  });
});

router.use('/tresc', require('./content'));
router.use('/media', require('./media'));
router.use('/menu', require('./menu'));
router.use('/import-pdf', require('./pdf-import'));
router.use('/promocje', require('./promotions'));
router.use('/produkty', require('./products'));
router.use('/zamowienia', require('./orders'));
router.use('/ustawienia', require('./settings'));
router.use('/', require('./misc'));

function one(sql) {
  try { return db.prepare(sql).get().n; } catch { return 0; }
}
function safeCounts() {
  try {
    return {
      total: db.prepare("SELECT COUNT(*) n FROM inquiries WHERE status='new'").get().n,
      orders: db.prepare("SELECT COUNT(*) n FROM orders WHERE status='new'").get().n,
    };
  } catch {
    return {};
  }
}

module.exports = router;
