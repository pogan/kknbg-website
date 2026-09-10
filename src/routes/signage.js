'use strict';

const express = require('express');
const menuService = require('../services/menu.service');
const promoService = require('../services/promotions.service');
const settingsService = require('../services/settings.service');
const events = require('../services/events.service');
const site = require('../config/site');

const router = express.Router();

/**
 * Digital signage — jedno źródło treści dla strony i ~35 ekranów w lokalu.
 * `/signage/feed.json` — dane; `/signage` — pełnoekranowy widok pod telewizor.
 * Parametr ?zone= pozwala pokazać różną treść na różnych ekranach.
 */

function buildFeed(locale = 'pl') {
  const menus = menuService.listForLocale(locale)
    .filter((m) => ['a_la_carte', 'seasonal', 'drinks'].includes(m.type))
    .map((m) => {
      const full = menuService.publishedBySlug(m.slug, locale);
      return {
        title: m.title,
        sections: (full ? full.sections : []).slice(0, 6).map((s) => ({
          name: s.name,
          items: (s.items || []).slice(0, 12).map((it) => ({
            name: it.name, price: it.price_grosze != null ? (it.price_grosze / 100).toFixed(2) : (it.price_note || ''),
          })),
        })),
      };
    });

  const now = new Date();
  const isoDow = now.getDay() === 0 ? 7 : now.getDay();
  const weekly = promoService.weekly(locale).find((p) => p.weekday === isoDow) || null;
  const timed = promoService.liveTimed(locale);

  return {
    generatedAt: new Date().toISOString(),
    venue: { name: site.name, address: settingsService.getSiteSettings().address },
    todayPromo: weekly ? { label: weekly.short_label, title: weekly.title, description: weekly.description } : null,
    promos: timed.map((p) => ({ label: p.short_label, title: p.title, description: p.description })),
    menus,
    events: events.upcoming(locale, 3).map((e) => ({ name: e.name, date: e.startDate })),
    fixtures: events.fixtures().slice(0, 4),
  };
}

router.get('/signage/feed.json', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json(buildFeed(req.query.locale === 'en' ? 'en' : 'pl'));
});

router.get('/signage', (req, res) => {
  res.locals.seo = { ...res.locals.seo, robots: 'noindex,nofollow', title: 'Ekran — Nowy Browar Gdański' };
  res.render('pages/signage', {
    layout: 'layouts/bare',
    feed: buildFeed(req.query.locale === 'en' ? 'en' : 'pl'),
    zone: req.query.zone || 'main',
    bodyClass: 'signage',
  });
});

module.exports = router;
