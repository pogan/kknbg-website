'use strict';

const db = require('../db');

/**
 * Serwis menu. Pełna logika (edycja, wersjonowanie, publikacja) rozwijana
 * w Fazie 4. Tu funkcje odczytu używane przez strony publiczne.
 */

const TYPES = ['a_la_carte', 'seasonal', 'group', 'xmas', 'drinks'];

const listPublishedByType = db.prepare(`
  SELECT * FROM menus WHERE locale = ? AND status = 'published' ORDER BY position, id
`);
const getBySlug = db.prepare(`SELECT * FROM menus WHERE slug = ? AND locale = ?`);
const getById = db.prepare(`SELECT * FROM menus WHERE id = ?`);
const sectionsFor = db.prepare(`SELECT * FROM menu_sections WHERE menu_id = ? ORDER BY position, id`);
const itemsFor = db.prepare(`SELECT * FROM menu_items WHERE section_id = ? ORDER BY position, id`);
const revisionById = db.prepare(`SELECT * FROM menu_revisions WHERE id = ?`);
const revisionsFor = db.prepare(`SELECT id, version, note, created_at, created_by FROM menu_revisions WHERE menu_id = ? ORDER BY version DESC`);

function hydrateSections(menuId) {
  return sectionsFor.all(menuId).map((s) => ({
    ...s,
    items: itemsFor.all(s.id).map((it) => ({
      ...it,
      tags: safeParse(it.tags_json, []),
    })),
  }));
}

/** Zwraca opublikowane menu danego typu wraz z bieżącą wersją (z rewizji jeśli jest). */
function publishedMenu(type, locale = 'pl') {
  const all = listPublishedByType.all(locale).filter((m) => m.type === type);
  if (!all.length) return null;
  const menu = all[0];
  return withCurrentContent(menu);
}

function publishedBySlug(slug, locale = 'pl') {
  const menu = getBySlug.get(slug, locale);
  if (!menu || menu.status !== 'published') return null;
  return withCurrentContent(menu);
}

function withCurrentContent(menu) {
  let sections;
  if (menu.current_revision_id) {
    const rev = revisionById.get(menu.current_revision_id);
    sections = rev ? safeParse(rev.snapshot_json, { sections: [] }).sections : hydrateSections(menu.id);
  } else {
    sections = hydrateSections(menu.id);
  }
  return { ...menu, sections };
}

function listForLocale(locale = 'pl') {
  return listPublishedByType.all(locale).map((m) => ({ ...m }));
}

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

module.exports = {
  TYPES,
  publishedMenu,
  publishedBySlug,
  listForLocale,
  hydrateSections,
  withCurrentContent,
  _stmts: { getBySlug, getById, sectionsFor, itemsFor, revisionsFor, revisionById },
  safeParse,
};
