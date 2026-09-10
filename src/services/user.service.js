'use strict';

const db = require('../db');
const { isAdminEmail } = require('../middleware/auth');

const byId = db.prepare('SELECT * FROM users WHERE id = ?');
const byEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const byGoogle = db.prepare('SELECT * FROM users WHERE google_id = ?');
const insert = db.prepare(`
  INSERT INTO users (google_id, email, name, avatar_url, role, last_login_at)
  VALUES (@google_id, @email, @name, @avatar_url, @role, datetime('now'))
`);
const touch = db.prepare(`
  UPDATE users SET name = @name, avatar_url = @avatar_url, google_id = COALESCE(@google_id, google_id),
    role = @role, last_login_at = datetime('now') WHERE id = @id
`);

function roleFor(email) {
  return isAdminEmail(email) ? 'admin' : 'user';
}

function findById(id) {
  return byId.get(id) || null;
}

/** Znajdź lub utwórz użytkownika po profilu Google / e-mailu. */
function upsertFromProfile({ googleId = null, email, name = '', avatar = '' }) {
  const normEmail = String(email).toLowerCase().trim();
  const role = roleFor(normEmail);
  let user = (googleId && byGoogle.get(googleId)) || byEmail.get(normEmail);
  if (user) {
    touch.run({ id: user.id, name: name || user.name, avatar_url: avatar || user.avatar_url, google_id: googleId, role });
    return findById(user.id);
  }
  const info = insert.run({ google_id: googleId, email: normEmail, name, avatar_url: avatar, role });
  return findById(info.lastInsertRowid);
}

module.exports = { findById, upsertFromProfile, roleFor };
