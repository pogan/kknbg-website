'use strict';

/** Usuwa plik bazy danych i odtwarza pusty schemat. */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
for (const f of ['kknbg.sqlite', 'kknbg.sqlite-wal', 'kknbg.sqlite-shm', 'sessions.sqlite']) {
  const p = path.join(DATA_DIR, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('  usunięto', f);
  }
}

const db = require('./index');
db.applySchema();
console.log('✔ Baza zresetowana.');
