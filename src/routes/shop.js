'use strict';

const express = require('express');
const { formLimiter, csrfProtection } = require('../middleware/security');
const shop = require('../services/shop.service');
const cart = require('../services/cart.service');
const orders = require('../services/order.service');
const payments = require('../services/payments.mock');
const settingsService = require('../services/settings.service');
const jsonld = require('../lib/jsonld');
const site = require('../config/site');

const router = express.Router();

function shopEnabled(req, res, next) {
  if (settingsService.getSiteSettings().features.shop === false) {
    return res.status(404).render('errors/404', { layout: 'layouts/base' });
  }
  next();
}
router.use(['/sklep', '/koszyk', '/zamowienie', '/platnosc'], shopEnabled);

// Wiek 18+ — prosta bramka na cookie
function ageOk(req) {
  return req.cookies && req.cookies.nbg_age === '1';
}

// ============================ LISTA ====================================
router.get('/sklep', (req, res) => {
  const products = shop.listActive();
  res.locals.seo = {
    ...res.locals.seo,
    title: `${req.t('shop.title')} — ${site.name}`,
    description: req.t('shop.lead'),
    jsonld: [
      ...res.locals.baseJsonld,
      {
        '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, url: jsonld.abs(`/sklep/${p.slug}`), name: p.name,
        })),
      },
    ],
  };
  res.render('shop/list', {
    products,
    ageOk: ageOk(req),
    cartCount: cart.summary(req).count,
  });
});

// ============================ PRODUKT ==================================
router.get('/sklep/:slug', (req, res, next) => {
  const product = shop.bySlug(req.params.slug);
  if (!product || !product.is_active) return next();
  res.locals.seo = {
    ...res.locals.seo,
    title: `${product.name} — ${req.t('shop.title')} — ${site.name}`,
    description: product.description || product.subtitle,
    ogType: 'product',
    ogImage: product.image ? jsonld.abs(product.image) : res.locals.seo.ogImage,
    jsonld: [...res.locals.baseJsonld, jsonld.product(product, product.image), jsonld.breadcrumb([
      { name: 'Start', path: '/' }, { name: req.t('shop.title'), path: '/sklep' }, { name: product.name, path: `/sklep/${product.slug}` },
    ])],
  };
  res.render('shop/product', { product, ageOk: ageOk(req), cartCount: cart.summary(req).count });
});

// ============================ WIEK 18+ ================================
router.post('/sklep/wiek', csrfProtection, (req, res) => {
  if (req.body.confirm === 'yes') {
    res.cookie('nbg_age', '1', { maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'lax', httpOnly: false });
    return res.redirect(req.body.back || '/sklep');
  }
  res.redirect('/');
});

// ============================ KOSZYK =================================
router.get('/koszyk', (req, res) => {
  res.locals.seo = { ...res.locals.seo, title: `${req.t('shop.cart')} — ${site.name}`, robots: 'noindex,nofollow' };
  res.render('shop/cart', { summary: cart.summary(req, req.query.delivery === 'courier' ? 'courier' : 'pickup') });
});

router.post('/koszyk/dodaj', csrfProtection, (req, res) => {
  cart.add(req, Number(req.body.product_id), Number(req.body.qty) || 1);
  if (req.xhr || req.accepts('json') === 'json') {
    return res.json({ ok: true, count: cart.summary(req).count });
  }
  res.redirect(req.body.back || '/koszyk');
});

router.post('/koszyk/aktualizuj', csrfProtection, (req, res) => {
  for (const [key, val] of Object.entries(req.body)) {
    const m = key.match(/^qty\[(\d+)\]$/);
    if (m) cart.setQty(req, Number(m[1]), Number(val) || 0);
  }
  res.redirect('/koszyk');
});

router.post('/koszyk/usun', csrfProtection, (req, res) => {
  cart.remove(req, Number(req.body.product_id));
  res.redirect('/koszyk');
});

// ============================ CHECKOUT ==============================
router.get('/zamowienie', (req, res) => {
  const summary = cart.summary(req, 'pickup');
  if (summary.empty) return res.redirect('/koszyk');
  res.locals.seo = { ...res.locals.seo, title: `${req.t('shop.checkoutTitle')} — ${site.name}`, robots: 'noindex,nofollow' };
  res.render('shop/checkout', { summary });
});

router.post('/zamowienie', formLimiter, csrfProtection, async (req, res, next) => {
  try {
    const fulfillment = req.body.fulfillment === 'courier' ? 'courier' : 'pickup';
    const summary = cart.summary(req, fulfillment);
    if (summary.empty) return res.redirect('/koszyk');

    if (!req.body.consent_terms || !req.body.consent_age) {
      req.session.flash = { type: 'error', text: 'Zaznacz wymagane zgody.' };
      return res.redirect('/zamowienie');
    }
    if (!req.body.name || !req.body.email) {
      req.session.flash = { type: 'error', text: req.t('contact.error') };
      return res.redirect('/zamowienie');
    }

    const order = orders.create({
      summary,
      fulfillment,
      billing: {
        name: req.body.name, email: req.body.email, phone: req.body.phone,
        street: req.body.street, city: req.body.city, postal: req.body.postal,
        company: req.body.company, nip: req.body.nip,
      },
      note: req.body.note || '',
      consent: { terms: true, age: true, marketing: req.body.consent_marketing === 'on', ts: new Date().toISOString() },
    });

    const payment = payments.createPayment(order);
    req.session.lastOrder = order.number;
    res.redirect(payment.redirectUrl);
  } catch (err) { next(err); }
});

// ============================ BRAMKA (MOCK) =========================
router.get('/platnosc/:number', (req, res, next) => {
  const order = orders.getByNumber(req.params.number);
  if (!order) return next();
  res.locals.seo = { ...res.locals.seo, robots: 'noindex,nofollow', title: 'Płatność' };
  res.render('shop/gateway', { order, layout: 'layouts/bare' });
});

// symulacja zwrotu z bramki -> woła webhook -> przekierowanie
router.post('/platnosc/:number/rozstrzygnij', csrfProtection, async (req, res, next) => {
  try {
    const outcome = req.body.outcome === 'paid' ? 'paid' : 'failed';
    const result = await payments.handleWebhook({ orderNumber: req.params.number, outcome });
    if (outcome === 'paid') {
      cart.clear(req);
      return res.redirect(`/zamowienie/potwierdzenie/${req.params.number}`);
    }
    req.session.flash = { type: 'error', text: req.t('shop.paymentCancelled') };
    return res.redirect('/koszyk');
  } catch (err) { next(err); }
});

// ============================ POTWIERDZENIE ========================
router.get('/zamowienie/potwierdzenie/:number', (req, res, next) => {
  const order = orders.getByNumber(req.params.number);
  if (!order) return next();
  res.locals.seo = { ...res.locals.seo, robots: 'noindex,nofollow', title: req.t('shop.thankYouTitle') };
  res.render('shop/thankyou', { order });
});

module.exports = router;
