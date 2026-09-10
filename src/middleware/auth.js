'use strict';

const env = require('../config/env');

function isAdminEmail(email) {
  return !!email && env.ADMIN_EMAIL_LIST.includes(String(email).toLowerCase());
}

/** Wymaga zalogowanego administratora. Inaczej -> /auth/login lub 403. */
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    // zalogowany, ale bez uprawnień
    return res.status(403).render('pages/no-access', { layout: 'layouts/base' });
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect(res.locals.localePath ? res.locals.localePath('/auth/login') : '/auth/login');
}

/** Wymaga jakiegokolwiek zalogowania. */
function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  req.session.returnTo = req.originalUrl;
  return res.redirect('/auth/login');
}

module.exports = { ensureAdmin, ensureAuth, isAdminEmail };
