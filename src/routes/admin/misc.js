'use strict';

const express = require('express');
const inquiries = require('../../services/inquiry.service');
const mailer = require('../../services/mailer.mock');
const { csrfProtection } = require('../../middleware/security');

const router = express.Router();

// --- Zapytania z formularzy ------------------------------------------
router.get('/zapytania', (req, res) => {
  const type = req.query.type || null;
  res.render('admin/inquiries', {
    layout: 'layouts/admin',
    title: 'Zapytania',
    inquiries: inquiries.recent(type, 200),
    activeType: type,
    counts: inquiries.newCounts(),
  });
});

router.post('/zapytania/:id/status', csrfProtection, (req, res) => {
  inquiries.markHandled(Number(req.params.id), req.body.status === 'spam' ? 'spam' : 'handled');
  res.redirect('back');
});

// --- Skrzynka (mock outbox) -----------------------------------------
router.get('/outbox', (req, res) => {
  res.render('admin/outbox', {
    layout: 'layouts/admin',
    title: 'Skrzynka (outbox)',
    messages: mailer.listOutbox(100),
  });
});

module.exports = router;
