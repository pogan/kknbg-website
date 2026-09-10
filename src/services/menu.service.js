'use strict';

const db = require('../db');
const { slugify } = require('../lib/slug');
const { parsePriceToGrosze } = require('../lib/money');

const TYPES = ['a_la_carte', 'seasonal', 'group', 'xmas', 'drinks'];
const TYPE_LABELS = {
  a_la_carte: 'à la carte', seasonal: 'sezonowe', group: 'grupowe', xmas: 'wigilijne', drinks: 'napoje',
};

// ---------- statements ----------
const S = {
  listPublished: db.prepare(`SELECT * FROM menus WHERE locale = ? AND status = 'published' ORDER BY position, id`),
  listAll: db.prepare(`SELECT * FROM menus ORDER BY locale, position, id`),
  getBySlug: db.prepare(`SELECT * FROM menus WHERE slug = ? AND locale = ?`),
  getById: db.prepare(`SELECT * FROM menus WHERE id = ?`),
  insertMenu: db.prepare(`INSERT INTO menus (type, locale, slug, title, intro, status, source_pdf_path, position, created_by)
    VALUES (@type, @locale, @slug, @title, @intro, @status, @source_pdf_path, @position, @created_by)`),
  updateMenu: db.prepare(`UPDATE menus SET title=@title, intro=@intro, type=@type, source_pdf_path=@source_pdf_path,
    updated_at=datetime('now') WHERE id=@id`),
  setStatus: db.prepare(`UPDATE menus SET status=?, updated_at=datetime('now') WHERE id=?`),
  setCurrentRevision: db.prepare(`UPDATE menus SET current_revision_id=?, status='published', updated_at=datetime('now') WHERE id=?`),
  deleteMenu: db.prepare(`DELETE FROM menus WHERE id=?`),

  sectionsFor: db.prepare(`SELECT * FROM menu_sections WHERE menu_id=? ORDER BY position, id`),
  itemsFor: db.prepare(`SELECT * FROM menu_items WHERE section_id=? ORDER BY position, id`),
  deleteSections: db.prepare(`DELETE FROM menu_sections WHERE menu_id=?`),
  insertSection: db.prepare(`INSERT INTO menu_sections (menu_id, name, note, position) VALUES (?, ?, ?, ?)`),
  insertItem: db.prepare(`INSERT INTO menu_items (section_id, name, description, weight, price_grosze, price_note, tags_json, allergens, position)
    VALUES (@section_id, @name, @description, @weight, @price_grosze, @price_note, @tags_json, @allergens, @position)`),

  insertRevision: db.prepare(`INSERT INTO menu_revisions (menu_id, version, snapshot_json, note, source_pdf_import_id, created_by)
    VALUES (@menu_id, @version, @snapshot_json, @note, @source_pdf_import_id, @created_by)`),
  revisionById: db.prepare(`SELECT * FROM menu_revisions WHERE id=?`),
  revisionsFor: db.prepare(`SELECT r.id, r.version, r.note, r.created_at, u.name AS author
    FROM menu_revisions r LEFT JOIN users u ON u.id = r.created_by
    WHERE r.menu_id=? ORDER BY r.version DESC`),
  maxVersion: db.prepare(`SELECT COALESCE(MAX(version),0) v FROM menu_revisions WHERE menu_id=?`),
};

function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// ---------- odczyt (working state) ----------
function hydrateSections(menuId) {
  return S.sectionsFor.all(menuId).map((s) => ({
    id: s.id, name: s.name, note: s.note, position: s.position,
    items: S.itemsFor.all(s.id).map((it) => ({
      id: it.id, name: it.name, description: it.description, weight: it.weight,
      price_grosze: it.price_grosze, price_note: it.price_note,
      tags: safeParse(it.tags_json, []), allergens: it.allergens, position: it.position,
    })),
  }));
}

/** Menu z treścią bieżącej opublikowanej rewizji (lub working state). */
function withCurrentContent(menu) {
  let sections;
  if (menu.current_revision_id) {
    const rev = S.revisionById.get(menu.current_revision_id);
    sections = rev ? safeParse(rev.snapshot_json, { sections: [] }).sections : hydrateSections(menu.id);
  } else {
    sections = hydrateSections(menu.id);
  }
  return { ...menu, sections };
}

function publishedBySlug(slug, locale = 'pl') {
  const menu = S.getBySlug.get(slug, locale);
  if (!menu || menu.status !== 'published') return null;
  return withCurrentContent(menu);
}

function listForLocale(locale = 'pl') {
  return S.listPublished.all(locale);
}

// ---------- odczyt (admin) ----------
function listAllForAdmin() {
  return S.listAll.all().map((m) => ({
    ...m,
    typeLabel: TYPE_LABELS[m.type] || m.type,
    revisionCount: S.maxVersion.get(m.id).v,
  }));
}

function getForAdmin(id) {
  const menu = S.getById.get(id);
  if (!menu) return null;
  return {
    ...menu,
    sections: hydrateSections(menu.id),
    revisions: S.revisionsFor.all(menu.id),
  };
}

function getRevision(id) {
  const rev = S.revisionById.get(id);
  if (!rev) return null;
  return { ...rev, snapshot: safeParse(rev.snapshot_json, { sections: [] }) };
}

// ---------- zapis ----------
const normItems = (items = []) =>
  items.map((it, i) => ({
    section_id: null,
    name: String(it.name || '').trim(),
    description: String(it.description || '').trim(),
    weight: String(it.weight || '').trim(),
    price_grosze: it.price_grosze != null ? it.price_grosze : parsePriceToGrosze(it.price),
    price_note: String(it.priceNote || it.price_note || '').trim(),
    tags_json: JSON.stringify(Array.isArray(it.tags) ? it.tags : []),
    allergens: String(it.allergens || '').trim(),
    position: i,
  }));

/** Zapisuje working state (sekcje + pozycje) menu. Nie publikuje. */
const replaceContent = db.transaction((menuId, sections = []) => {
  S.deleteSections.run(menuId);
  sections.forEach((sec, si) => {
    const info = S.insertSection.run(menuId, String(sec.name || 'Sekcja').trim(), String(sec.note || '').trim(), si);
    const secId = info.lastInsertRowid;
    for (const item of normItems(sec.items || [])) {
      if (!item.name) continue;
      S.insertItem.run({ ...item, section_id: secId });
    }
  });
});

/** Tworzy nowe menu z obiektu danych (seed / import PDF). */
const createFromData = db.transaction((data, userId = null, { publish = false } = {}) => {
  const slug = data.slug || slugify(data.title);
  const existing = S.getBySlug.get(slug, data.locale || 'pl');
  let menuId;
  if (existing) {
    menuId = existing.id;
    S.updateMenu.run({
      id: menuId, title: data.title, intro: data.intro || '', type: data.type,
      source_pdf_path: data.sourcePdf || existing.source_pdf_path || null,
    });
  } else {
    const info = S.insertMenu.run({
      type: data.type, locale: data.locale || 'pl', slug, title: data.title,
      intro: data.intro || '', status: 'draft',
      source_pdf_path: data.sourcePdf || null, position: data.position || 0, created_by: userId,
    });
    menuId = info.lastInsertRowid;
  }
  replaceContent(menuId, data.sections || []);
  if (publish) publish_(menuId, userId, data.revisionNote || 'Import początkowy');
  return S.getById.get(menuId);
});

/** Publikuje working state jako nową rewizję i ustawia ją jako bieżącą. */
function publish_(menuId, userId = null, note = '', sourcePdfImportId = null) {
  const version = S.maxVersion.get(menuId).v + 1;
  const snapshot = { sections: hydrateSections(menuId), publishedAt: new Date().toISOString() };
  const info = S.insertRevision.run({
    menu_id: menuId, version, snapshot_json: JSON.stringify(snapshot),
    note: note || `Wersja ${version}`, source_pdf_import_id: sourcePdfImportId, created_by: userId,
  });
  S.setCurrentRevision.run(info.lastInsertRowid, menuId);
  return { version, revisionId: info.lastInsertRowid };
}

/** Przywraca menu do wskazanej rewizji (kopiuje jej treść do working state + publikuje jako nowa wersja). */
const rollback = db.transaction((menuId, revisionId, userId = null) => {
  const rev = S.revisionById.get(revisionId);
  if (!rev || rev.menu_id !== menuId) throw new Error('Rewizja nie należy do tego menu.');
  const snap = safeParse(rev.snapshot_json, { sections: [] });
  replaceContent(menuId, snap.sections);
  return publish_(menuId, userId, `Przywrócono wersję ${rev.version}`);
});

function saveWorking(menuId, { title, intro, type, sections }, userId = null) {
  const menu = S.getById.get(menuId);
  if (!menu) throw new Error('Menu nie istnieje.');
  S.updateMenu.run({
    id: menuId, title: title ?? menu.title, intro: intro ?? menu.intro,
    type: type ?? menu.type, source_pdf_path: menu.source_pdf_path,
  });
  if (sections) replaceContent(menuId, sections);
}

function setStatus(menuId, status) {
  S.setStatus.run(status, menuId);
}
function remove(menuId) {
  S.deleteMenu.run(menuId);
}

// sitemap
function sitemapEntries() {
  return S.listAll.all()
    .filter((m) => m.status === 'published')
    .map((m) => ({
      path: (m.locale === 'pl' ? '' : `/${m.locale}`) + `/menu/${m.slug}`,
      lastmod: m.updated_at,
      changefreq: 'weekly',
      priority: '0.8',
    }));
}

module.exports = {
  TYPES, TYPE_LABELS,
  publishedBySlug, listForLocale, withCurrentContent, hydrateSections,
  listAllForAdmin, getForAdmin, getRevision,
  createFromData, publish: publish_, rollback, saveWorking, setStatus, remove,
  sitemapEntries, safeParse,
};
