'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const db = require('../db');
const { parseMenuText } = require('./pdfParser');
const menuService = require('./menu.service');

const PDF_DIR = path.join(__dirname, '..', '..', 'data', 'pdf');
fs.mkdirSync(PDF_DIR, { recursive: true });

const S = {
  insert: db.prepare(`INSERT INTO pdf_imports (original_name, stored_path, bytes, pages, status, raw_text, parsed_json, created_by)
    VALUES (@original_name, @stored_path, @bytes, @pages, @status, @raw_text, @parsed_json, @created_by)`),
  byId: db.prepare('SELECT * FROM pdf_imports WHERE id = ?'),
  list: db.prepare('SELECT id, original_name, status, pages, created_at, target_menu_id FROM pdf_imports ORDER BY created_at DESC LIMIT 50'),
  setReviewed: db.prepare("UPDATE pdf_imports SET reviewed_json = ?, status = 'reviewed' WHERE id = ?"),
  setApplied: db.prepare("UPDATE pdf_imports SET status = 'applied', target_menu_id = ? WHERE id = ?"),
  setFailed: db.prepare("UPDATE pdf_imports SET status = 'failed', error = ? WHERE id = ?"),
};

/** Wgrywa PDF, ekstrahuje tekst i uruchamia parser heurystyczny. */
async function createFromUpload(file, { userId = null, locale = 'pl' } = {}) {
  const id = crypto.randomBytes(6).toString('hex');
  const stored = `${Date.now()}-${id}.pdf`;
  fs.writeFileSync(path.join(PDF_DIR, stored), file.buffer);

  let rawText = '';
  let pages = 0;
  let parsed = { sections: [], meta: {} };
  let status = 'parsed';
  try {
    const data = await pdfParse(file.buffer);
    rawText = data.text || '';
    pages = data.numpages || 0;
    parsed = parseMenuText(rawText, { locale });
  } catch (err) {
    status = 'failed';
    parsed = { sections: [], meta: { error: err.message } };
  }

  const info = S.insert.run({
    original_name: file.originalname,
    stored_path: `/data/pdf/${stored}`,
    bytes: file.size || file.buffer.length,
    pages,
    status,
    raw_text: rawText.slice(0, 200000),
    parsed_json: JSON.stringify(parsed),
    created_by: userId,
  });
  return get(info.lastInsertRowid);
}

function get(id) {
  const row = S.byId.get(id);
  if (!row) return null;
  return {
    ...row,
    parsed: safe(row.parsed_json, { sections: [] }),
    reviewed: row.reviewed_json ? safe(row.reviewed_json, null) : null,
  };
}

function list() {
  return S.list.all();
}

function saveReview(id, sections) {
  S.setReviewed.run(JSON.stringify({ sections }), id);
  return get(id);
}

/**
 * Tworzy / aktualizuje menu z przejrzanych danych importu.
 * mode: 'new' — nowe menu (draft) ; 'revision' — nowa wersja robocza istniejącego menu.
 */
function applyToMenu(id, opts, userId = null) {
  const imp = get(id);
  if (!imp) throw new Error('Import nie istnieje.');
  const sections = (imp.reviewed && imp.reviewed.sections) || imp.parsed.sections || [];

  const data = {
    type: opts.type || 'a_la_carte',
    locale: opts.locale || 'pl',
    slug: opts.slug || undefined,
    title: opts.title || imp.original_name.replace(/\.pdf$/i, ''),
    intro: opts.intro || '',
    sourcePdf: `/uploads/menus/${path.basename(imp.stored_path)}`,
    sections: sections.map((s) => ({
      name: s.name,
      note: s.note || '',
      items: (s.items || []).map((it) => ({
        name: it.name,
        weight: it.weight || '',
        price_grosze: it.price_grosze != null ? it.price_grosze : null,
        price: it.price,
        priceNote: it.price_note || '',
        description: it.description || '',
        tags: it.tags || [],
      })),
    })),
  };

  // skopiuj oryginalny PDF do katalogu publicznego, by działał przycisk „Pobierz PDF"
  try {
    const src = path.join(__dirname, '..', '..', imp.stored_path.replace(/^\//, ''));
    const destDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'menus');
    fs.mkdirSync(destDir, { recursive: true });
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(destDir, path.basename(imp.stored_path)));
  } catch { /* noop */ }

  const menu = menuService.createFromData(data, userId, {
    publish: opts.publish === true,
    revisionNote: `Import z PDF: ${imp.original_name}`,
  });
  S.setApplied.run(menu.id, id);
  db.prepare(`INSERT INTO audit_log (user_id, action, entity, entity_id, meta_json)
    VALUES (?, 'pdf.apply', 'menu', ?, ?)`).run(userId, String(menu.id), JSON.stringify({ importId: id }));
  return menu;
}

function safe(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = { createFromUpload, get, list, saveReview, applyToMenu, PDF_DIR };
