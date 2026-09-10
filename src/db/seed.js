'use strict';

/* Wypełnia bazę danymi demonstracyjnymi (idempotentnie — można uruchamiać wielokrotnie). */
const path = require('path');
const fs = require('fs');
const db = require('./index');
const site = require('../config/site');
const defaults = require('../config/default-content');
const settingsService = require('../services/settings.service');
const menuService = require('../services/menu.service');
const { slugify } = require('../lib/slug');
const { parsePriceToGrosze } = require('../lib/money');

db.applySchema();

const now = () => new Date().toISOString();
const daysFromNow = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString(); };

// ---------------------------------------------------------------------------
// 1. Ustawienia witryny
// ---------------------------------------------------------------------------
function seedSettings() {
  settingsService.set('business_name', site.name);
  settingsService.set('tagline', site.tagline);
  settingsService.set('address', site.address);
  settingsService.set('contact', site.contact);
  settingsService.set('social', site.social);
  settingsService.set('opening_hours', site.openingHours);
  settingsService.set('service_notes', site.serviceNotes);
  settingsService.set('features', { shop: true, reservations: true, newsletter: true, instagram: true });
  settingsService.set('analytics', { ga4: '', gtm: '', metaPixel: '', tiktokPixel: '', clarity: '' });
  settingsService.set('delivery_links', { wolt: 'https://wolt.com/', pyszne: 'https://pyszne.pl/', ubereats: '' });
  settingsService.set('reservation_widget_url', '');
  settingsService.clearCache();
  console.log('  ✔ ustawienia');
}

// ---------------------------------------------------------------------------
// 2. Bloki treści (kopiujemy domyślne do bazy, by były edytowalne w panelu)
// ---------------------------------------------------------------------------
function seedContent() {
  const upsert = db.prepare(`
    INSERT INTO content_blocks (key, locale, title, body_html, format)
    VALUES (@key, @locale, @title, @body_html, 'html')
    ON CONFLICT(key, locale) DO NOTHING
  `);
  const map = [
    ['home.intro', 'Restauracja w samym sercu Wrzeszcza', defaults.homeIntro],
    ['home.story', 'Historia miejsca', defaults.story],
    ['home.groups', 'Eventy i przyjęcia', defaults.groupsTeaser],
    ['about.lead', 'Historia spotyka nowoczesność', defaults.aboutLead],
    ['about.history', 'Danziger Aktien-Bierbrauerei', defaults.aboutHistory],
    ['about.space', 'Przestrzeń i wnętrza', defaults.aboutSpace],
    ['about.brewing', 'Podziemia i fermentownia', defaults.aboutBrewing],
    ['menu.intro', 'Nasze Menu', defaults.menuIntro],
    ['beers.intro', 'Piwa z naszej piwnicy', defaults.beersIntro],
    ['promotions.intro', 'Promocje', defaults.promoIntro],
    ['groups.lead', 'Oferta dla grup', defaults.groupsLead],
    ['groups.packages', 'Pakiety eventowe', defaults.groupsPackages],
    ['groups.buffet', 'Menu bufetowe', defaults.groupsBuffet],
    ['groups.communions', 'Komunie i chrzciny', defaults.groupsCommunions],
    ['sport.lead', 'Strefa kibica', defaults.sportLead],
    ['b2b.lead', 'Oferta B2B', defaults.b2bLead],
    ['b2b.details', 'Zakres współpracy', defaults.b2bDetails],
    ['contact.lead', 'Kontakt', defaults.contactLead],
    ['location.lead', 'Jak do nas trafić', defaults.locationLead],
    ['legal.privacy', 'Polityka prywatności', defaults.legalPrivacy],
    ['legal.terms', 'Regulamin', defaults.legalTerms],
    ['legal.shop', 'Regulamin sklepu', defaults.legalShop],
  ];
  for (const [key, title, html] of map) {
    upsert.run({ key, locale: 'pl', title, body_html: html.trim() });
    upsert.run({ key, locale: 'en', title, body_html: html.trim() }); // EN dziedziczy do czasu tłumaczenia
  }
  console.log('  ✔ bloki treści');
}

// ---------------------------------------------------------------------------
// 3. Menu (z plików seed-data) + kopia PDF do public/uploads
// ---------------------------------------------------------------------------
function seedMenus() {
  // kopiuj oryginalne PDF-y menu do katalogu publicznego
  const pubDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'menus');
  fs.mkdirSync(pubDir, { recursive: true });
  const pdfs = [
    ['nbg_nowe_menu_20260829_PL.pdf', 'nbg_menu_pl.pdf'],
    ['nbg_nowe_menu_20260829_EN.pdf', 'nbg_menu_en.pdf'],
    ['nbg_nowe_menu_20260829_WIGILIA.pdf', 'nbg_menu_wigilia.pdf'],
  ];
  for (const [src, dest] of pdfs) {
    const from = path.join(__dirname, '..', '..', 'kk_input_data', src);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(pubDir, dest));
  }

  const files = [
    'menu-alacarte-pl.js', 'menu-alacarte-en.js', 'menu-xmas-pl.js', 'menu-drinks-pl.js',
  ];
  for (const f of files) {
    const data = require(path.join(__dirname, 'seed-data', f));
    menuService.createFromData(data, null, { publish: true, revisionNote: 'Import startowy (seed)' });
    console.log(`  ✔ menu: ${data.title} (${data.locale})`);
  }
}

// ---------------------------------------------------------------------------
// 4. Promocje
// ---------------------------------------------------------------------------
function seedPromotions() {
  const count = db.prepare('SELECT COUNT(*) n FROM promotions').get().n;
  if (count > 0) { console.log('  • promocje już istnieją, pomijam'); return; }
  const ins = db.prepare(`INSERT INTO promotions (locale, kind, weekday, title, short_label, description, starts_at, ends_at, is_active, position)
    VALUES (@locale, @kind, @weekday, @title, @short_label, @description, @starts_at, @ends_at, 1, @position)`);
  const weekly = [
    { weekday: 1, title: 'Piwo Pils 1+1', short_label: '1+1', description: 'Kup jeden Artus Pils Gdański, drugi dostajesz gratis.' },
    { weekday: 2, title: 'Zupa gratis do dania głównego', short_label: 'GRATIS', description: 'Do każdego dania głównego zupa dnia w cenie.' },
    { weekday: 3, title: '-30% na wszystkie burgery', short_label: '-30%', description: 'Środa burgerowa — cały dzień.' },
    { weekday: 4, title: 'Wszystkie nalewki domowe 1+1', short_label: '1+1', description: 'Domowe nalewki w parach.' },
    { weekday: 5, title: '-30% na pizzę do 18:00', short_label: '-30%', description: 'Piątek, cała pizza z pieca 30% taniej do godz. 18:00.' },
  ];
  weekly.forEach((p, i) => ins.run({ locale: 'pl', kind: 'weekly', weekday: p.weekday, title: p.title, short_label: p.short_label, description: p.description, starts_at: null, ends_at: null, position: i }));

  const timed = [
    { title: 'Tydzień Sour Ale', short_label: 'NOWOŚĆ', description: 'Premiera Lato Sour Ale z wiśnią i czarną porzeczką — degustacja 0,2 l w cenie 9 zł.', starts_at: daysFromNow(-2), ends_at: daysFromNow(9) },
    { title: 'Happy Hours 15:00–17:00', short_label: '-20%', description: 'Od poniedziałku do czwartku wszystkie piwa z naszego browaru 20% taniej.', starts_at: daysFromNow(-10), ends_at: daysFromNow(45) },
  ];
  timed.forEach((p, i) => ins.run({ locale: 'pl', kind: 'timed', weekday: null, title: p.title, short_label: p.short_label, description: p.description, starts_at: p.starts_at, ends_at: p.ends_at, position: i }));
  console.log('  ✔ promocje');
}

// ---------------------------------------------------------------------------
// 5. Produkty sklepu (piwa + zestaw + voucher)
// ---------------------------------------------------------------------------
function seedProducts() {
  const count = db.prepare('SELECT COUNT(*) n FROM products').get().n;
  if (count > 0) { console.log('  • produkty już istnieją, pomijam'); return; }
  const ins = db.prepare(`INSERT INTO products
    (slug, name, subtitle, description, style, abv, plato, volume_ml, pack_size, price_grosze, stock, untappd_url, category, is_active, is_featured, position, meta_json)
    VALUES (@slug, @name, @subtitle, @description, @style, @abv, @plato, @volume_ml, @pack_size, @price_grosze, @stock, @untappd_url, @category, 1, @is_featured, @position, '{}')`);

  site.beers.forEach((b, i) => {
    ins.run({
      slug: b.slug, name: b.name, subtitle: b.style,
      description: b.descPl, style: b.style, abv: b.abv, plato: b.plato || null,
      volume_ml: 500, pack_size: 6,
      price_grosze: parsePriceToGrosze(b.abv >= 6 ? '89' : '79'), // cena za 6-pak
      stock: 24 - i * 2, untappd_url: b.untappd, category: 'beer',
      is_featured: i < 3 ? 1 : 0, position: i,
    });
  });

  ins.run({
    slug: 'zestaw-degustacyjny-6', name: 'Zestaw degustacyjny — 6 piw', subtitle: 'Po jednej butelce każdego stylu',
    description: 'Sześć piw z piwnicy Nowego Browaru Gdańskiego: Bursztynowy Lager, Artus Pils, Katamaran Cold IPA, Hazy IPA, Lato Sour Ale, Lager Free. Idealny na prezent.',
    style: 'Mixed pack', abv: null, plato: null, volume_ml: 500, pack_size: 6,
    price_grosze: parsePriceToGrosze('79'), stock: 15, untappd_url: '', category: 'set', is_featured: 1, position: 10,
  });
  ins.run({
    slug: 'bon-podarunkowy-100', name: 'Bon podarunkowy 100 zł', subtitle: 'Do wykorzystania w restauracji',
    description: 'Elektroniczny bon podarunkowy o wartości 100 zł do wykorzystania na miejscu w Nowym Browarze Gdańskim.',
    style: '', abv: null, plato: null, volume_ml: null, pack_size: 1,
    price_grosze: parsePriceToGrosze('100'), stock: 999, untappd_url: '', category: 'voucher', is_featured: 0, position: 20,
  });

  // podłącz wygenerowane grafiki (public/img/shop/<slug>.jpg) jako media
  const shopImgDir = path.join(__dirname, '..', '..', 'public', 'img', 'shop');
  const insMedia = db.prepare(`INSERT INTO media (filename, path, variants_json, alt, mime) VALUES (?, ?, '{}', ?, 'image/jpeg')`);
  const linkProduct = db.prepare('UPDATE products SET media_id = ? WHERE slug = ?');
  for (const p of db.prepare('SELECT id, slug, name FROM products').all()) {
    const file = path.join(shopImgDir, `${p.slug}.jpg`);
    if (fs.existsSync(file)) {
      const mid = insMedia.run(`${p.slug}.jpg`, `/img/shop/${p.slug}.jpg`, p.name).lastInsertRowid;
      linkProduct.run(mid, p.slug);
    }
  }
  console.log('  ✔ produkty sklepu (+ grafiki)');
}

// ---------------------------------------------------------------------------
(function run() {
  console.log('Seed — Nowy Browar Gdański');
  seedSettings();
  seedContent();
  seedMenus();
  seedPromotions();
  seedProducts();
  console.log('✔ Gotowe.');
})();
