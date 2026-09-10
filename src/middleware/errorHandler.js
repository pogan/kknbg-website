'use strict';

const env = require('../config/env');

function notFound(req, res) {
  res.status(404);
  res.locals.seo = { ...(res.locals.seo || {}), title: (req.t && req.t('errors.404title')) || 'Nie znaleziono', robots: 'noindex,follow' };
  if (req.accepts('html')) {
    return res.render('errors/404', { layout: 'layouts/base' });
  }
  return res.json({ error: 'Not Found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('✖', req.method, req.originalUrl, '\n', err.stack || err);
  }
  res.status(status);
  res.locals.seo = { ...(res.locals.seo || {}), title: (req.t && req.t('errors.500title')) || 'Błąd', robots: 'noindex,nofollow' };

  if (err.code === 'EBADCSRFTOKEN' || err.code === 'ERR_BAD_CSRF_TOKEN' || /csrf/i.test(err.message || '')) {
    res.status(403);
    if (req.session) req.session.flash = { type: 'error', text: (req.t && req.t('contact.error')) || 'Sesja wygasła — odśwież stronę i spróbuj ponownie.' };
    return res.redirect('back');
  }

  if (req.accepts('html')) {
    return res.render('errors/500', {
      layout: 'layouts/base',
      showStack: env.NODE_ENV === 'development',
      err,
    });
  }
  return res.json({ error: status >= 500 ? 'Internal Server Error' : err.message });
}

module.exports = { notFound, errorHandler };
