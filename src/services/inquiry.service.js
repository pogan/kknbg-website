'use strict';

const crypto = require('crypto');
const db = require('../db');
const env = require('../config/env');
const site = require('../config/site');
const mailer = require('./mailer.mock');

function newsletterToken(id) {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(`nl:${id}`).digest('hex').slice(0, 16);
}

const insert = db.prepare(`
  INSERT INTO inquiries (type, name, email, phone, message, meta_json, status)
  VALUES (@type, @name, @email, @phone, @message, @meta_json, 'new')
`);
const list = db.prepare('SELECT * FROM inquiries WHERE (@type IS NULL OR type = @type) ORDER BY created_at DESC LIMIT @limit');
const byId = db.prepare('SELECT * FROM inquiries WHERE id = ?');
const setStatus = db.prepare('UPDATE inquiries SET status = ? WHERE id = ?');
const counts = db.prepare("SELECT type, COUNT(*) n FROM inquiries WHERE status='new' GROUP BY type");

const MAIL_TARGET = {
  contact: env.MAIL_TO_CONTACT,
  reservation: env.MAIL_TO_CONTACT,
  event: env.MAIL_TO_CONTACT,
  b2b: env.MAIL_TO_B2B,
  newsletter: env.MAIL_TO_CONTACT,
};

const SUBJECTS = {
  contact: 'Nowa wiadomość z formularza kontaktowego',
  reservation: 'Nowe zgłoszenie rezerwacji stolika',
  event: 'Nowe zapytanie o event / grupę',
  b2b: 'Nowe zapytanie B2B / gastronomia',
  newsletter: 'Nowy zapis do newslettera',
};

async function create({ type, name = '', email = '', phone = '', message = '', meta = {} }) {
  const info = insert.run({
    type,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    message: message.trim(),
    meta_json: JSON.stringify(meta || {}),
  });

  const lines = [
    `Typ: ${type}`,
    name && `Imię i nazwisko: ${name}`,
    email && `E-mail: ${email}`,
    phone && `Telefon: ${phone}`,
    ...Object.entries(meta || {}).map(([k, v]) => `${k}: ${v}`),
    message && `\nWiadomość:\n${message}`,
    `\n— zgłoszenie #${info.lastInsertRowid}, ${new Date().toLocaleString('pl-PL')}`,
  ].filter(Boolean);

  if (type === 'newsletter') {
    // double opt-in — link potwierdzający
    const token = newsletterToken(info.lastInsertRowid);
    const link = `${site.baseUrl}/newsletter/potwierdz/${info.lastInsertRowid}-${token}`;
    await mailer.send({
      to: email,
      subject: 'Potwierdź zapis do newslettera Nowego Browaru Gdańskiego',
      text: `Cześć!\n\nAby dokończyć zapis do newslettera, kliknij w link:\n${link}\n\nJeśli to nie Ty — zignoruj tę wiadomość.`,
      meta: { inquiryId: info.lastInsertRowid, type },
    });
  } else {
    await mailer.send({
      to: MAIL_TARGET[type] || env.MAIL_TO_CONTACT,
      replyTo: email || undefined,
      subject: SUBJECTS[type] || 'Nowe zgłoszenie ze strony',
      text: lines.join('\n'),
      meta: { inquiryId: info.lastInsertRowid, type },
    });
  }

  return byId.get(info.lastInsertRowid);
}

/** Potwierdza zapis do newslettera (double opt-in). */
function confirmNewsletter(id, token) {
  const row = byId.get(Number(id));
  if (!row || row.type !== 'newsletter') return false;
  if (token !== newsletterToken(Number(id))) return false;
  const meta = (() => { try { return JSON.parse(row.meta_json); } catch { return {}; } })();
  meta.confirmed = true;
  meta.confirmedAt = new Date().toISOString();
  db.prepare("UPDATE inquiries SET meta_json = ?, status = 'handled' WHERE id = ?").run(JSON.stringify(meta), Number(id));
  return true;
}

function recent(type = null, limit = 100) {
  return list.all({ type, limit });
}
function get(id) {
  return byId.get(id);
}
function markHandled(id, status = 'handled') {
  setStatus.run(status, id);
}
function newCounts() {
  const out = {};
  for (const r of counts.all()) out[r.type] = r.n;
  out.total = Object.values(out).reduce((a, b) => a + b, 0);
  return out;
}

module.exports = { create, recent, get, markHandled, newCounts, confirmNewsletter };
