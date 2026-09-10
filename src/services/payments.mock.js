'use strict';

const env = require('../config/env');
const orders = require('./order.service');

/**
 * Mockowana bramka płatności. Interfejs zaprojektowany tak, aby podmiana na
 * Autopay / Przelewy24 / PayU / Stripe wymagała tylko implementacji
 * createPayment() + weryfikacji podpisu w webhooku.
 */

/** Zwraca URL, na który przekierowujemy klienta po złożeniu zamówienia. */
function createPayment(order) {
  if (env.PAYMENTS_PROVIDER === 'mock') {
    return { redirectUrl: `/platnosc/${order.number}`, provider: 'mock' };
  }
  // Miejsce na realną integrację:
  // return providerClient.createTransaction({ amount: order.total_grosze, ... })
  return { redirectUrl: `/platnosc/${order.number}`, provider: env.PAYMENTS_PROVIDER };
}

/** Obsługa powiadomienia (webhook) — w mocku wywoływana z ekranu bramki. */
async function handleWebhook({ orderNumber, outcome, ref }) {
  const order = orders.getByNumber(orderNumber);
  if (!order) return { ok: false, error: 'not_found' };
  if (outcome === 'paid') {
    await orders.markPaid(order.id, ref || `MOCK-${Date.now()}`);
    return { ok: true, status: 'paid' };
  }
  await orders.markFailed(order.id, ref || `MOCK-REJECT-${Date.now()}`);
  return { ok: true, status: 'failed' };
}

module.exports = { createPayment, handleWebhook };
