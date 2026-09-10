'use strict';

const express = require('express');
const multer = require('multer');
const env = require('../../config/env');
const pdfImport = require('../../services/pdfImport.service');
const menuService = require('../../services/menu.service');
const { csrfProtection } = require('../../middleware/security');
const { slugify } = require('../../lib/slug');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Dozwolone tylko pliki PDF.')),
});

// Lista importów + upload
router.get('/', (req, res) => {
  res.render('admin/pdf-import-list', {
    layout: 'layouts/admin',
    title: 'Import menu z PDF',
    imports: pdfImport.list(),
  });
});

router.post('/', upload.single('pdf'), csrfProtection, async (req, res, next) => {
  try {
    if (!req.file) throw new Error('Nie wybrano pliku PDF.');
    const imp = await pdfImport.createFromUpload(req.file, { userId: req.user.id, locale: req.body.locale || 'pl' });
    req.session.flash = { type: 'success', text: `Wczytano „${imp.original_name}" — wykryto ${imp.parsed.meta.itemCount || 0} pozycji w ${imp.parsed.meta.sectionCount || 0} sekcjach. Sprawdź i popraw poniżej.` };
    res.redirect(`/admin/import-pdf/${imp.id}`);
  } catch (err) { next(err); }
});

// Widok przeglądu / korekty
router.get('/:id', (req, res, next) => {
  const imp = pdfImport.get(Number(req.params.id));
  if (!imp) return next();
  const data = imp.reviewed || imp.parsed;
  res.render('admin/pdf-import-review', {
    layout: 'layouts/admin',
    title: `Import: ${imp.original_name}`,
    imp,
    sections: data.sections || [],
    tags: [['veg', 'wege'], ['gf', 'bezglutenowe'], ['spicy', 'ostre'], ['new', 'nowość']],
    existingMenus: menuService.listAllForAdmin(),
    types: menuService.TYPE_LABELS,
    suggestedSlug: slugify(imp.original_name.replace(/\.pdf$/i, '')),
  });
});

// Zapis korekty (bez publikacji)
router.post('/:id/review', csrfProtection, (req, res, next) => {
  try {
    const sections = parseSections(req.body.payload);
    pdfImport.saveReview(Number(req.params.id), sections);
    req.session.flash = { type: 'success', text: 'Zapisano poprawki.' };
    res.redirect(`/admin/import-pdf/${req.params.id}`);
  } catch (err) { next(err); }
});

// Zastosuj -> utwórz menu (draft)
router.post('/:id/apply', csrfProtection, (req, res, next) => {
  try {
    const sections = parseSections(req.body.payload);
    pdfImport.saveReview(Number(req.params.id), sections);
    const menu = pdfImport.applyToMenu(Number(req.params.id), {
      title: req.body.title,
      type: req.body.type,
      locale: req.body.locale || 'pl',
      slug: req.body.slug || undefined,
      intro: req.body.intro || '',
      publish: req.body.publish === 'on',
    }, req.user.id);
    req.session.flash = {
      type: 'success',
      text: req.body.publish === 'on'
        ? `Utworzono i opublikowano menu „${menu.title}".`
        : `Utworzono menu „${menu.title}" jako wersję roboczą. Sprawdź i opublikuj w module Menu.`,
    };
    res.redirect(`/admin/menu/${menu.id}`);
  } catch (err) { next(err); }
});

function parseSections(raw) {
  if (!raw) return [];
  try {
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(p.sections) ? p.sections : [];
  } catch {
    return [];
  }
}

module.exports = router;
