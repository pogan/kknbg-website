'use strict';

const express = require('express');
const promo = require('../../services/promotions.service');
const mediaService = require('../../services/media.service');
const { csrfProtection } = require('../../middleware/security');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('admin/promotions', {
    layout: 'layouts/admin',
    title: 'Promocje',
    promotions: promo.allAdmin(),
    media: mediaService.list(60),
  });
});

router.get('/nowa', (req, res) => {
  res.render('admin/promotion-edit', {
    layout: 'layouts/admin',
    title: 'Nowa promocja',
    promo: { id: null, kind: 'timed', locale: 'pl', is_active: 1, weekday: null, position: 0 },
    media: mediaService.list(60),
    isNew: true,
  });
});

router.get('/:id', (req, res, next) => {
  const p = promo.get(Number(req.params.id));
  if (!p) return next();
  res.render('admin/promotion-edit', {
    layout: 'layouts/admin',
    title: `Promocja: ${p.title}`,
    promo: p, media: mediaService.list(60), isNew: false,
  });
});

router.post('/', csrfProtection, (req, res) => {
  const id = promo.create(req.body);
  req.session.flash = { type: 'success', text: 'Dodano promocję.' };
  res.redirect(`/admin/promocje/${id}`);
});

router.post('/:id', csrfProtection, (req, res) => {
  promo.update(Number(req.params.id), req.body);
  req.session.flash = { type: 'success', text: 'Zapisano promocję.' };
  res.redirect('/admin/promocje');
});

router.post('/:id/toggle', csrfProtection, (req, res) => {
  promo.toggle(Number(req.params.id));
  res.redirect('/admin/promocje');
});

router.post('/:id/usun', csrfProtection, (req, res) => {
  promo.remove(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'Usunięto promocję.' };
  res.redirect('/admin/promocje');
});

module.exports = router;
