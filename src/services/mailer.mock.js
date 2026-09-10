'use strict';

const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const OUTBOX = path.join(__dirname, '..', '..', 'data', 'outbox');
if (!fs.existsSync(OUTBOX)) fs.mkdirSync(OUTBOX, { recursive: true });

/**
 * Mockowany mailer. `MAILER=outbox` zapisuje wiadomości jako pliki .eml
 * w data/outbox oraz zwraca metadane (widoczne w panelu admina).
 * Interfejs identyczny jak realny transport — podmiana bez zmian w wywołaniach.
 */
async function send({ to, subject, text, html, replyTo, meta = {} }) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const stamp = new Date().toISOString();
  const recipients = Array.isArray(to) ? to.join(', ') : to;

  const eml = [
    `Date: ${stamp}`,
    `From: ${env.MAIL_FROM}`,
    `To: ${recipients}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    text || stripHtml(html || ''),
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const file = path.join(OUTBOX, `${stamp.replace(/[:.]/g, '-')}__${sanitize(subject)}.eml`);
  fs.writeFileSync(file, eml, 'utf8');

  const record = { id, to: recipients, subject, sentAt: stamp, file: path.basename(file), meta };
  if (env.NODE_ENV !== 'test') {
    console.log(`✉  [outbox] "${subject}" -> ${recipients} (${record.file})`);
  }
  return record;
}

function listOutbox(limit = 50) {
  return fs
    .readdirSync(OUTBOX)
    .filter((f) => f.endsWith('.eml'))
    .sort()
    .reverse()
    .slice(0, limit)
    .map((f) => {
      const content = fs.readFileSync(path.join(OUTBOX, f), 'utf8');
      const subject = (content.match(/^Subject: (.*)$/m) || [])[1] || f;
      const to = (content.match(/^To: (.*)$/m) || [])[1] || '';
      const date = (content.match(/^Date: (.*)$/m) || [])[1] || '';
      return { file: f, subject, to, date, body: content.split('\n\n').slice(1).join('\n\n') };
    });
}

function stripHtml(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim();
}
function sanitize(s) {
  return String(s).replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
}

module.exports = { send, listOutbox, OUTBOX };
