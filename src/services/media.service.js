'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const db = require('../db');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const SIZES = [400, 800, 1400];

const S = {
  insert: db.prepare(`INSERT INTO media (filename, path, variants_json, alt, width, height, mime, bytes, uploaded_by)
    VALUES (@filename, @path, @variants_json, @alt, @width, @height, @mime, @bytes, @uploaded_by)`),
  list: db.prepare('SELECT * FROM media ORDER BY created_at DESC LIMIT ?'),
  byId: db.prepare('SELECT * FROM media WHERE id = ?'),
  setAlt: db.prepare('UPDATE media SET alt = ? WHERE id = ?'),
  del: db.prepare('DELETE FROM media WHERE id = ?'),
};

/**
 * Przetwarza wgrany obraz: generuje warianty webp w kilku rozmiarach + oryginał jpg.
 * @param {{buffer:Buffer, originalname:string, mimetype:string}} file
 */
async function ingestImage(file, { alt = '', userId = null } = {}) {
  const id = crypto.randomBytes(8).toString('hex');
  const base = `${Date.now()}-${id}`;
  const img = sharp(file.buffer, { failOn: 'none' }).rotate();
  const meta = await img.metadata();

  const variants = { webp: {}, jpg: {} };
  const mainJpg = `${base}.jpg`;
  await img.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(UPLOAD_DIR, mainJpg));

  for (const w of SIZES) {
    if (meta.width && meta.width < w && w !== SIZES[0]) continue;
    const webpName = `${base}-${w}.webp`;
    await sharp(file.buffer).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(UPLOAD_DIR, webpName));
    variants.webp[w] = `/uploads/${webpName}`;
  }
  variants.jpg.original = `/uploads/${mainJpg}`;

  const stat = fs.statSync(path.join(UPLOAD_DIR, mainJpg));
  const info = S.insert.run({
    filename: file.originalname,
    path: `/uploads/${mainJpg}`,
    variants_json: JSON.stringify(variants),
    alt,
    width: meta.width || null,
    height: meta.height || null,
    mime: 'image/jpeg',
    bytes: stat.size,
    uploaded_by: userId,
  });
  return S.byId.get(info.lastInsertRowid);
}

function list(limit = 200) {
  return S.list.all(limit).map(hydrate);
}
function get(id) {
  const m = S.byId.get(id);
  return m ? hydrate(m) : null;
}
function hydrate(m) {
  let variants = {};
  try { variants = JSON.parse(m.variants_json); } catch { /* noop */ }
  return { ...m, variants };
}
function setAlt(id, alt) {
  S.setAlt.run(alt, id);
}
function remove(id) {
  const m = get(id);
  if (!m) return;
  const files = [m.path, ...Object.values(m.variants.webp || {}), ...Object.values(m.variants.jpg || {})];
  for (const f of files) {
    const p = path.join(__dirname, '..', '..', 'public', f);
    if (fs.existsSync(p)) { try { fs.unlinkSync(p); } catch { /* noop */ } }
  }
  S.del.run(id);
}

module.exports = { ingestImage, list, get, setAlt, remove, UPLOAD_DIR };
