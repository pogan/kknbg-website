'use strict';

const db = require('../db');
const env = require('../config/env');
const shop = require('./shop.service');
const mailer = require('./mailer.mock');
const { formatPrice } = require('../lib/money');

const S = {
  insertOrder: db.prepare(`INSERT INTO orders
    (number, email, phone, name, address_json, fulfillment, status, payment_status, payment_provider,
     subtotal_grosze, shipping_grosze, total_grosze, currency, note, consent_json)
    VALUES (@number, @email, @phone, @name, @address_json, @fulfillment, 'new', 'pending', @payment_provider,
     @subtotal_grosze, @shipping_grosze, @total_grosze, @currency, @note, @consent_json)`),
  insertItem: db.prepare(`INSERT INTO order_items (order_id, product_id, name_snapshot, unit_price_grosze, qty)
    VALUES (?, ?, ?, ?, ?)`),
  byNumber: db.prepare('SELECT * FROM orders WHERE number = ?'),
  byId: db.prepare('SELECT * FROM orders WHERE id = ?'),
  itemsFor: db.prepare('SELECT * FROM order_items WHERE order_id = ?'),
  list: db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?'),
  setPayment: db.prepare(`UPDATE orders SET payment_status = ?, status = ?, payment_ref = ?, updated_at = datetime('now') WHERE id = ?`),
  setStatus: db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`),
};

function genNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NBG-${ymd}-${rand}`;
}

/** Tworzy zamówienie z podsumowania koszyka. Zwraca pełne zamówienie. */
const create = db.transaction(({ summary, billing, fulfillment, note = '', consent = {} }) => {
  const number = genNumber();
  const info = S.insertOrder.run({
    number,
    email: billing.email,
    phone: billing.phone || '',
    name: billing.name,
    address_json: JSON.stringify({
      street: billing.street || '', city: billing.city || '', postal: billing.postal || '',
      company: billing.company || '', nip: billing.nip || '',
    }),
    fulfillment,
    payment_provider: env.PAYMENTS_PROVIDER,
    subtotal_grosze: summary.subtotal,
    shipping_grosze: summary.shipping,
    total_grosze: summary.total,
    currency: env.PAYMENTS_CURRENCY,
    note,
    consent_json: JSON.stringify(consent),
  });
  const orderId = info.lastInsertRowid;
  for (const line of summary.items) {
    S.insertItem.run(orderId, line.product.id, line.product.name, line.product.price_grosze, line.qty);
  }
  return getById(orderId);
});

function getByNumber(number) {
  const o = S.byNumber.get(number);
  return o ? hydrate(o) : null;
}
function getById(id) {
  const o = S.byId.get(id);
  return o ? hydrate(o) : null;
}
function hydrate(o) {
  return {
    ...o,
    address: safe(o.address_json, {}),
    consent: safe(o.consent_json, {}),
    items: S.itemsFor.all(o.id),
  };
}

function list(limit = 200) {
  return S.list.all(limit).map(hydrate);
}

/** Wywoływane przez webhook płatności. */
async function markPaid(orderId, ref = '') {
  const order = getById(orderId);
  if (!order || order.payment_status === 'paid') return order;
  S.setPayment.run('paid', 'paid', ref, orderId);
  for (const it of order.items) {
    if (it.product_id) shop.decrementStock(it.product_id, it.qty);
  }
  await sendConfirmation(getById(orderId));
  return getById(orderId);
}

async function markFailed(orderId, ref = '') {
  S.setPayment.run('failed', 'cancelled', ref, orderId);
  return getById(orderId);
}

function setStatus(orderId, status) {
  S.setStatus.run(status, orderId);
}

async function sendConfirmation(order) {
  const lines = order.items.map((it) => `  ${it.qty}× ${it.name_snapshot} — ${formatPrice(it.unit_price_grosze * it.qty)}`);
  const body = [
    `Dziękujemy za zamówienie ${order.number}!`,
    '',
    ...lines,
    '',
    `Dostawa: ${order.fulfillment === 'courier' ? 'kurier' : 'odbiór w lokalu'} — ${formatPrice(order.shipping_grosze)}`,
    `Razem: ${formatPrice(order.total_grosze)}`,
    '',
    order.fulfillment === 'pickup'
      ? 'Odbiór: Nowy Browar Gdański, ul. Jana Kilińskiego 7E, Gdańsk. Poinformujemy, gdy zamówienie będzie gotowe.'
      : 'Wyślemy paczkę kurierem na podany adres.',
    '',
    '— To wiadomość z prototypu. W wersji produkcyjnej: faktura + śledzenie przesyłki.',
  ].join('\n');

  await mailer.send({ to: order.email, subject: `Potwierdzenie zamówienia ${order.number}`, text: body, meta: { orderNumber: order.number } });
  await mailer.send({ to: env.MAIL_TO_SHOP, subject: `Nowe opłacone zamówienie ${order.number}`, text: body, meta: { orderNumber: order.number } });
}

function toCsv(orders) {
  const head = ['number', 'created_at', 'name', 'email', 'phone', 'fulfillment', 'status', 'payment_status', 'total_pln', 'items'];
  const rows = orders.map((o) => [
    o.number, o.created_at, o.name, o.email, o.phone, o.fulfillment, o.status, o.payment_status,
    (o.total_grosze / 100).toFixed(2),
    o.items.map((i) => `${i.qty}x ${i.name_snapshot}`).join('; '),
  ]);
  return [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function safe(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = { create, getByNumber, getById, list, markPaid, markFailed, setStatus, toCsv };
