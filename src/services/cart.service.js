'use strict';

const shop = require('./shop.service');

const SHIPPING_COURIER_GROSZE = 1900;
const FREE_SHIPPING_THRESHOLD = 20000;

function getCart(req) {
  if (!req.session.cart) req.session.cart = {};
  return req.session.cart;
}

function add(req, productId, qty = 1) {
  const cart = getCart(req);
  const p = shop.byId(productId);
  if (!p || !p.is_active) return;
  cart[productId] = Math.max(1, Math.min((cart[productId] || 0) + qty, p.stock || 99));
  req.session.cart = cart;
}

function setQty(req, productId, qty) {
  const cart = getCart(req);
  if (qty <= 0) {
    delete cart[productId];
  } else {
    const p = shop.byId(productId);
    cart[productId] = Math.min(qty, (p && p.stock) || 99);
  }
  req.session.cart = cart;
}

function remove(req, productId) {
  const cart = getCart(req);
  delete cart[productId];
  req.session.cart = cart;
}

function clear(req) {
  req.session.cart = {};
}

/** Zwraca pozycje + podsumowanie dla danej metody dostawy. */
function summary(req, fulfillment = 'pickup') {
  const cart = getCart(req);
  const items = [];
  let subtotal = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const p = shop.byId(Number(id));
    if (!p) continue;
    const lineTotal = p.price_grosze * qty;
    subtotal += lineTotal;
    items.push({ product: shop.bySlug(p.slug), qty, lineTotal });
  }
  const shipping =
    fulfillment === 'courier' && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_COURIER_GROSZE : 0;
  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    empty: items.length === 0,
  };
}

module.exports = { getCart, add, setQty, remove, clear, summary, SHIPPING_COURIER_GROSZE, FREE_SHIPPING_THRESHOLD };
