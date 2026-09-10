'use strict';

const express = require('express');
const orders = require('../../services/order.service');
const { csrfProtection } = require('../../middleware/security');

const router = express.Router();

router.get('/', (req, res) => {
  const list = orders.list(300);
  res.render('admin/orders', {
    layout: 'layouts/admin', title: 'Sklep — zamówienia', orders: list,
    totals: {
      count: list.length,
      paid: list.filter((o) => o.payment_status === 'paid').length,
      revenue: list.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + o.total_grosze, 0),
    },
  });
});

router.get('/eksport.csv', (req, res) => {
  res.type('text/csv').attachment('zamowienia-nbg.csv').send(orders.toCsv(orders.list(1000)));
});

router.get('/:id', (req, res, next) => {
  const order = orders.getById(Number(req.params.id));
  if (!order) return next();
  res.render('admin/order-detail', { layout: 'layouts/admin', title: `Zamówienie ${order.number}`, order });
});

router.post('/:id/status', csrfProtection, (req, res) => {
  const allowed = ['new', 'paid', 'packed', 'shipped', 'completed', 'cancelled'];
  if (allowed.includes(req.body.status)) orders.setStatus(Number(req.params.id), req.body.status);
  req.session.flash = { type: 'success', text: 'Zmieniono status zamówienia.' };
  res.redirect(`/admin/zamowienia/${req.params.id}`);
});

module.exports = router;
