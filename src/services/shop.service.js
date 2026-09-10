'use strict';

const db = require('../db');

/**
 * Serwis sklepu. Odczyt produktów + koszyk sesyjny + zamówienia.
 * Płatności obsługuje payments.mock.js. Rozwijany w Fazie 7.
 */
const S = {
  activeProducts: db.prepare(`SELECT p.*, m.path AS media_path, m.variants_json AS media_variants
    FROM products p LEFT JOIN media m ON m.id = p.media_id
    WHERE p.is_active = 1 ORDER BY p.position, p.id`),
  allProducts: db.prepare(`SELECT * FROM products ORDER BY position, id`),
  bySlug: db.prepare(`SELECT p.*, m.path AS media_path, m.variants_json AS media_variants
    FROM products p LEFT JOIN media m ON m.id = p.media_id WHERE p.slug = ?`),
  byId: db.prepare(`SELECT * FROM products WHERE id = ?`),
  decStock: db.prepare(`UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`),
};

function listActive() {
  return S.activeProducts.all().map(hydrate);
}
function listAll() {
  return S.allProducts.all();
}
function bySlug(slug) {
  const p = S.bySlug.get(slug);
  return p ? hydrate(p) : null;
}
function byId(id) {
  return S.byId.get(id) || null;
}
function decrementStock(productId, qty) {
  S.decStock.run(qty, productId);
}

function hydrate(p) {
  let variants = {};
  try { variants = p.media_variants ? JSON.parse(p.media_variants) : {}; } catch { /* noop */ }
  return { ...p, image: p.media_path || null, imageVariants: variants };
}

function sitemapEntries() {
  return S.allProducts.all()
    .filter((p) => p.is_active)
    .map((p) => ({ path: `/sklep/${p.slug}`, changefreq: 'weekly', priority: '0.6' }));
}

module.exports = { listActive, listAll, bySlug, byId, decrementStock, sitemapEntries };
