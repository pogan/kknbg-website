'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const env = require('../config/env');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH =
  env.NODE_ENV === 'test'
    ? path.join(DATA_DIR, 'test.sqlite')
    : path.join(DATA_DIR, 'kknbg.sqlite');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

/** Wykonuje schema.sql (idempotentnie). */
function applySchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
}

module.exports = db;
module.exports.applySchema = applySchema;
module.exports.DB_PATH = DB_PATH;
module.exports.DATA_DIR = DATA_DIR;
