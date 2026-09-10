'use strict';

const express = require('express');
const payments = require('../services/payments.mock');

const router = express.Router();

/**
 * Endpoint webhooka płatności. W prototypie obsługuje providera `mock`.
 * Produkcyjnie: weryfikacja podpisu (HMAC / klucz publiczny providera) przed
 * przetworzeniem, idempotencja po ID transakcji.
 */
router.post('/payments/:provider', express.json(), async (req, res) => {
  const { orderNumber, outcome, ref } = req.body || {};
  if (!orderNumber) return res.status(400).json({ ok: false, error: 'orderNumber required' });
  const result = await payments.handleWebhook({ orderNumber, outcome: outcome || 'paid', ref });
  res.status(result.ok ? 200 : 404).json(result);
});

module.exports = router;
