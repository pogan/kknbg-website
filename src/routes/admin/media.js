'use strict';

const express = require('express');
const multer = require('multer');
const env = require('../../config/env');
const mediaService = require('../../services/media.service');
const { csrfProtection } = require('../../middleware/security');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|avif|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Dozwolone tylko obrazy (JPG, PNG, WebP).'));
  },
});

router.get('/', (req, res) => {
  res.render('admin/media', { layout: 'layouts/admin', title: 'Biblioteka mediów', items: mediaService.list() });
});

// multer PRZED csrf — CSRF czyta token z req.body (multipart), więc body musi być już sparsowane
router.post('/', upload.array('files', 12), csrfProtection, async (req, res, next) => {
  try {
    for (const file of req.files || []) {
      await mediaService.ingestImage(file, { alt: req.body.alt || '', userId: req.user.id });
    }
    req.session.flash = { type: 'success', text: `Wgrano ${req.files?.length || 0} plik(ów).` };
    res.redirect('/admin/media');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/alt', csrfProtection, (req, res) => {
  mediaService.setAlt(Number(req.params.id), req.body.alt || '');
  res.redirect('/admin/media');
});

router.post('/:id/delete', csrfProtection, (req, res) => {
  mediaService.remove(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'Usunięto plik.' };
  res.redirect('/admin/media');
});

module.exports = router;
