'use strict';

const express = require('express');
const { ensureAdmin } = require('../../middleware/auth');

const router = express.Router();

// Panel administracyjny jest zawsze noindex.
router.use((req, res, next) => {
  res.locals.seo = { ...(res.locals.seo || {}), robots: 'noindex,nofollow' };
  res.locals.adminNav = [
    { label: 'Pulpit', path: '/admin', icon: 'grid' },
    { label: 'Treść stron', path: '/admin/tresc', icon: 'file-text' },
    { label: 'Menu', path: '/admin/menu', icon: 'book-open' },
    { label: 'Import PDF', path: '/admin/import-pdf', icon: 'upload' },
    { label: 'Promocje', path: '/admin/promocje', icon: 'tag' },
    { label: 'Sklep — produkty', path: '/admin/produkty', icon: 'package' },
    { label: 'Sklep — zamówienia', path: '/admin/zamowienia', icon: 'shopping-bag' },
    { label: 'Media', path: '/admin/media', icon: 'image' },
    { label: 'Zapytania', path: '/admin/zapytania', icon: 'inbox' },
    { label: 'Skrzynka (outbox)', path: '/admin/outbox', icon: 'mail' },
    { label: 'Ustawienia', path: '/admin/ustawienia', icon: 'settings' },
  ];
  next();
});

router.use(ensureAdmin);

router.get('/', (req, res) => {
  res.render('admin/dashboard', { layout: 'layouts/admin', title: 'Pulpit' });
});

// Kolejne podmoduły dołączane w następnych fazach:
// router.use('/tresc', require('./content'));
// router.use('/menu', require('./menu'));
// itd.

module.exports = router;
