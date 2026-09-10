'use strict';

const express = require('express');
const ogImage = require('../lib/ogImage');
const menuService = require('../services/menu.service');
const promoService = require('../services/promotions.service');

const router = express.Router();

/**
 * Dynamiczne obrazy OG:
 *   /og/default.png
 *   /og/menu/<slug>.png
 *   /og/promo/<id>.png
 *   /og/page.png?title=...&subtitle=...
 */
router.get('/og/menu/:slug.png', async (req, res, next) => {
  try {
    const m = menuService.publishedBySlug(req.params.slug, 'pl') || menuService.publishedBySlug(req.params.slug, 'en');
    const file = await ogImage.generate({
      key: `menu-${req.params.slug}`,
      kicker: 'Menu',
      title: m ? m.title : 'Nasze Menu',
      subtitle: m ? (m.intro || '').slice(0, 70) : '',
    });
    send(res, file);
  } catch (e) { next(e); }
});

router.get('/og/promo/:id.png', async (req, res, next) => {
  try {
    const p = promoService.get(Number(req.params.id));
    const file = await ogImage.generate({
      key: `promo-${req.params.id}`,
      kicker: 'Promocja',
      title: p ? p.title : 'Promocje w Nowym Browarze',
      subtitle: p ? p.description : '',
    });
    send(res, file);
  } catch (e) { next(e); }
});

router.get('/og/page.png', async (req, res, next) => {
  try {
    const title = String(req.query.title || 'Nowy Browar Gdański').slice(0, 80);
    const file = await ogImage.generate({
      key: `page-${Buffer.from(title).toString('hex').slice(0, 24)}`,
      title,
      subtitle: String(req.query.subtitle || '').slice(0, 70),
    });
    send(res, file);
  } catch (e) { next(e); }
});

router.get('/og/default.png', async (req, res, next) => {
  try {
    const file = await ogImage.generate({
      key: 'default',
      title: 'Nowy Browar Gdański',
      subtitle: 'Restauracja i browar rzemieślniczy w sercu Wrzeszcza',
    });
    send(res, file);
  } catch (e) { next(e); }
});

function send(res, file) {
  res.set('Cache-Control', 'public, max-age=86400');
  res.type('png').sendFile(file);
}

module.exports = router;
