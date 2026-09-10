'use strict';

const express = require('express');
const { formLimiter, csrfProtection } = require('../middleware/security');
const content = require('../services/content.service');
const menuService = require('../services/menu.service');
const promoService = require('../services/promotions.service');
const inquiries = require('../services/inquiry.service');
const events = require('../services/events.service');
const instagram = require('../services/instagram.service');
const jsonld = require('../lib/jsonld');
const site = require('../config/site');
const DEFAULTS = require('../config/default-content');

const router = express.Router();

/** Helper: skróć pobieranie bloku treści w bieżącym języku. */
function blocks(req, keys) {
  const out = {};
  for (const [key, defaults] of Object.entries(keys)) {
    out[key.replace(/[.\-/]/g, '_')] = content.block(key, req.locale, defaults);
  }
  return out;
}

function setSeo(res, data) {
  res.locals.seo = { ...res.locals.seo, ...data };
}

// ============================ HOME =======================================
router.get('/', (req, res) => {
  const locale = req.locale;
  setSeo(res, {
    title: req.t('seo.homeTitle'),
    description: req.t('seo.defaultDescription'),
    ogType: 'website',
    jsonld: [
      ...res.locals.baseJsonld,
      jsonld.faq([
        { q: 'Gdzie jest Nowy Browar Gdański?', a: `${site.address.street}, ${site.address.postal} ${site.address.city} (Wrzeszcz).` },
        { q: 'Czy warzycie własne piwo?', a: 'Tak — w podziemiach lokalu działa fermentownia. Warzymy kilka stylów, od lagera po Hazy IPA i Sour Ale.' },
        { q: 'Czy można zarezerwować stolik na mecz?', a: 'Tak, transmisje pokazujemy na 35 ekranach. Rezerwacje przez formularz lub telefonicznie.' },
      ]),
    ],
  });

  res.render('pages/home', {
    ...blocks(req, {
      'home.intro': { title: 'Restauracja w samym sercu Wrzeszcza', html: DEFAULTS.homeIntro },
      'home.story': { title: 'Historia miejsca', html: DEFAULTS.story },
      'home.groups': { title: 'Eventy i przyjęcia', html: DEFAULTS.groupsTeaser },
    }),
    menus: menuService.listForLocale(locale).slice(0, 4),
    beers: site.beers,
    promoHighlight: promoService.highlight(locale),
    weeklyPromos: promoService.weekly(locale),
    upcomingEvents: events.upcoming(locale, 3),
    instaPosts: instagram.recent(6),
  });
});

// ============================ O BROWARZE =================================
router.get('/o-browarze', (req, res) => {
  setSeo(res, {
    title: `O Browarze — ${site.name}`,
    description: 'Historia dawnego Danziger Aktien-Bierbrauerei i nowoczesny browar restauracyjny w Gdańsku-Wrzeszczu.',
    jsonld: [...res.locals.baseJsonld, jsonld.breadcrumb([{ name: 'Start', path: '/' }, { name: 'O Browarze', path: '/o-browarze' }])],
  });
  res.render('pages/about', {
    ...blocks(req, {
      'about.lead': { title: 'Historia spotyka nowoczesność', html: DEFAULTS.aboutLead },
      'about.history': { title: 'Danziger Aktien-Bierbrauerei', html: DEFAULTS.aboutHistory },
      'about.space': { title: 'Przestrzeń i wnętrza', html: DEFAULTS.aboutSpace },
      'about.brewing': { title: 'Podziemia i fermentownia', html: DEFAULTS.aboutBrewing },
    }),
  });
});

// ============================ MENU (hub) ================================
router.get('/menu', (req, res) => {
  const locale = req.locale;
  const menus = menuService.listForLocale(locale);
  setSeo(res, {
    title: `${req.t('menu.title')} — ${site.name}`,
    description: req.t('menu.lead'),
    jsonld: [...res.locals.baseJsonld, jsonld.breadcrumb([{ name: 'Start', path: '/' }, { name: 'Menu', path: '/menu' }])],
  });
  res.render('pages/menu-hub', {
    ...blocks(req, { 'menu.intro': { title: req.t('menu.title'), html: DEFAULTS.menuIntro } }),
    menus,
    menuTypes: menuService.TYPES,
  });
});

router.get('/menu/:slug', (req, res, next) => {
  const locale = req.locale;
  const menu = menuService.publishedBySlug(req.params.slug, locale);
  if (!menu) return next();
  setSeo(res, {
    title: `${menu.title} — ${site.name}`,
    description: menu.intro || req.t('menu.lead'),
    ogType: 'article',
    jsonld: [...res.locals.baseJsonld, jsonld.menu(menu, menu.sections), jsonld.breadcrumb([
      { name: 'Start', path: '/' }, { name: 'Menu', path: '/menu' }, { name: menu.title, path: `/menu/${menu.slug}` },
    ])],
  });
  res.render('pages/menu-single', { menu });
});

// ============================ PIWA ======================================
router.get('/piwa', (req, res) => {
  setSeo(res, {
    title: `${req.t('beers.title')} — ${site.name}`,
    description: req.t('beers.lead'),
    jsonld: [...res.locals.baseJsonld],
  });
  res.render('pages/beers', {
    ...blocks(req, { 'beers.intro': { title: req.t('beers.title'), html: DEFAULTS.beersIntro } }),
    beers: site.beers,
    ratings: instagram.beerRatings(),
  });
});

// ============================ PROMOCJE ==================================
router.get('/promocje', (req, res) => {
  const locale = req.locale;
  const data = promoService.forPublic(locale);
  setSeo(res, {
    title: `${req.t('promotions.title')} — ${site.name}`,
    description: req.t('promotions.lead'),
    jsonld: [...res.locals.baseJsonld],
  });
  res.render('pages/promotions', {
    ...blocks(req, { 'promotions.intro': { title: req.t('promotions.title'), html: DEFAULTS.promoIntro } }),
    weekly: data.weekly,
    timed: data.timed,
  });
});

// ============================ OFERTA DLA GRUP ===========================
router.get('/oferta-dla-grup', (req, res) => {
  setSeo(res, {
    title: `${req.t('groups.title')} — ${site.name}`,
    description: req.t('groups.lead'),
    jsonld: [...res.locals.baseJsonld],
  });
  res.render('pages/groups', {
    ...blocks(req, {
      'groups.lead': { title: req.t('groups.title'), html: DEFAULTS.groupsLead },
      'groups.packages': { title: 'Pakiety eventowe', html: DEFAULTS.groupsPackages },
      'groups.buffet': { title: 'Menu bufetowe', html: DEFAULTS.groupsBuffet },
      'groups.communions': { title: 'Komunie i chrzciny', html: DEFAULTS.groupsCommunions },
    }),
  });
});

// ============================ SPORT =====================================
router.get('/sport', (req, res) => {
  setSeo(res, {
    title: `${req.t('sport.title')} — ${site.name}`,
    description: req.t('sport.lead'),
    jsonld: [...res.locals.baseJsonld],
  });
  res.render('pages/sport', {
    ...blocks(req, { 'sport.lead': { title: req.t('sport.title'), html: DEFAULTS.sportLead } }),
    fixtures: events.fixtures(),
  });
});

// ============================ B2B =======================================
router.get('/wspolpraca-b2b', (req, res) => {
  setSeo(res, {
    title: `${req.t('b2b.title')} — ${site.name}`,
    description: req.t('b2b.lead'),
    jsonld: [...res.locals.baseJsonld],
  });
  res.render('pages/b2b', {
    ...blocks(req, {
      'b2b.lead': { title: req.t('b2b.title'), html: DEFAULTS.b2bLead },
      'b2b.details': { title: 'Zakres współpracy', html: DEFAULTS.b2bDetails },
    }),
  });
});

// ============================ KONTAKT / REZERWACJE ======================
router.get('/kontakt', (req, res) => {
  setSeo(res, {
    title: `${req.t('contact.title')} — ${site.name}`,
    description: req.t('contact.lead'),
    jsonld: [...res.locals.baseJsonld],
  });
  res.render('pages/contact', {
    ...blocks(req, { 'contact.lead': { title: req.t('contact.title'), html: DEFAULTS.contactLead } }),
  });
});

// ============================ LOKALIZACJA ===============================
router.get('/lokalizacja', (req, res) => {
  setSeo(res, {
    title: `${req.t('location.title')} — ${site.name}`,
    description: req.t('location.lead'),
    jsonld: [...res.locals.baseJsonld],
  });
  res.render('pages/location', {
    ...blocks(req, { 'location.lead': { title: req.t('location.title'), html: DEFAULTS.locationLead } }),
  });
});

// ============================ WYDARZENIA ================================
router.get('/wydarzenia', (req, res) => {
  const locale = req.locale;
  const list = events.upcoming(locale, 20);
  setSeo(res, {
    title: `Wydarzenia — ${site.name}`,
    description: 'Degustacje piw, zwiedzanie browaru, transmisje sportowe i imprezy tematyczne w Nowym Browarze Gdańskim.',
    jsonld: [...res.locals.baseJsonld, ...list.map((e) => jsonld.event(e))],
  });
  res.render('pages/events', { events: list });
});

// ============================ SOCIAL (link in bio) =====================
router.get('/social', (req, res) => {
  setSeo(res, { title: `${site.name} — social`, description: 'Wszystkie linki w jednym miejscu.', robots: 'noindex,follow' });
  res.render('pages/social', { layout: 'layouts/bare', instaPosts: instagram.recent(9) });
});

router.get('/newsletter/potwierdz/:tok', (req, res) => {
  const [id, token] = String(req.params.tok).split('-');
  const ok = inquiries.confirmNewsletter(id, token);
  setSeo(res, { title: 'Newsletter', robots: 'noindex,nofollow' });
  res.render('pages/simple-message', {
    layout: 'layouts/base',
    heading: ok ? 'Zapis potwierdzony ✓' : 'Nie udało się potwierdzić',
    text: ok
      ? 'Dziękujemy! Od teraz będziesz otrzymywać informacje o nowych piwach, sezonowym menu i wydarzeniach.'
      : 'Link jest nieprawidłowy lub wygasł. Spróbuj zapisać się ponownie.',
  });
});

router.get('/offline', (req, res) => {
  res.locals.seo = { ...res.locals.seo, robots: 'noindex,nofollow', title: 'Brak połączenia' };
  res.render('pages/offline', { layout: 'layouts/base' });
});

// ============================ STRONY PRAWNE =============================
const LEGAL = {
  '/polityka-prywatnosci': { key: 'legal.privacy', title: 'Polityka prywatności', def: 'legalPrivacy' },
  '/regulamin': { key: 'legal.terms', title: 'Regulamin', def: 'legalTerms' },
  '/regulamin-sklepu': { key: 'legal.shop', title: 'Regulamin sklepu', def: 'legalShop' },
};
for (const [path, cfg] of Object.entries(LEGAL)) {
  router.get(path, (req, res) => {
    setSeo(res, { title: `${cfg.title} — ${site.name}`, robots: 'noindex,follow' });
    res.render('pages/legal', {
      block: content.block(cfg.key, req.locale, { title: cfg.title, html: DEFAULTS[cfg.def] }),
    });
  });
}

// ============================ FORMULARZE ================================
const FORM_TYPES = new Set(['contact', 'b2b', 'reservation', 'event', 'newsletter']);

router.post('/formularz/:type', formLimiter, csrfProtection, async (req, res, next) => {
  const type = req.params.type;
  if (!FORM_TYPES.has(type)) return next();

  // honeypot
  if (req.body.company_website) {
    return respond(req, res, type, true); // udawaj sukces
  }

  const { name = '', email = '', phone = '', message = '' } = req.body;
  const meta = {};
  for (const k of ['guests', 'date', 'time', 'eventType', 'company', 'nip', 'channel', 'source']) {
    if (req.body[k]) meta[k] = String(req.body[k]).slice(0, 200);
  }

  if (type === 'newsletter' && !email) {
    return respond(req, res, type, false, 'Podaj adres e-mail.');
  }
  if (type !== 'newsletter' && (!name || (!email && !phone))) {
    return respond(req, res, type, false, req.t('contact.error'));
  }

  try {
    await inquiries.create({ type, name, email, phone, message, meta });
    return respond(req, res, type, true);
  } catch (err) {
    return next(err);
  }
});

function respond(req, res, type, ok, errorText) {
  const msgKey = {
    contact: 'contact.successContact',
    reservation: 'contact.successReservation',
    b2b: 'contact.successB2B',
    event: 'contact.successEvent',
    newsletter: 'footer.newsletterSuccess',
  }[type];
  const flash = ok
    ? { type: 'success', text: req.t(msgKey) }
    : { type: 'error', text: errorText || req.t('contact.error') };

  if (req.xhr || req.accepts('json') === 'json') {
    return res.status(ok ? 200 : 422).json(flash);
  }
  req.session.flash = flash;
  const back = req.get('referer') || '/kontakt';
  return res.redirect(back + (ok ? '#dziekujemy' : '#formularz'));
}

module.exports = router;
