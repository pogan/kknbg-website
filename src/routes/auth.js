'use strict';

const express = require('express');
const passport = require('../config/passport');
const env = require('../config/env');
const users = require('../services/user.service');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/admin');
  }
  res.render('pages/login', { layout: 'layouts/base', authMode: env.AUTH_MODE });
});

// --- Tryb GOOGLE ---------------------------------------------------------
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    const back = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(back);
  },
);

// --- Tryb MOCK (tylko gdy AUTH_MODE=mock) --------------------------------
router.post('/mock', (req, res, next) => {
  if (env.AUTH_MODE !== 'mock') return res.status(404).end();
  const as = req.body.as === 'user' ? 'user' : 'admin';
  const email = as === 'admin' ? env.ADMIN_EMAIL_LIST[0] : 'gosc.demo@example.com';
  const user = users.upsertFromProfile({
    email,
    name: as === 'admin' ? 'Administrator (demo)' : 'Gość (demo)',
  });
  req.login(user, (err) => {
    if (err) return next(err);
    const back = req.session.returnTo || (user.role === 'admin' ? '/admin' : '/');
    delete req.session.returnTo;
    res.redirect(back);
  });
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
