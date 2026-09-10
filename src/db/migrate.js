'use strict';

/** Stosuje schemat bazy. Bezpieczne do wielokrotnego uruchamiania. */
const db = require('./index');

db.applySchema();
console.log('✔ Schemat bazy zastosowany:', db.DB_PATH);
