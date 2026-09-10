'use strict';

/**
 * Feed Instagrama i oceny Untappd — w prototypie mockowane z lokalnego JSON.
 * Docelowo: Behold/EmbedSocial (IG) oraz Untappd API (oceny piw).
 * Interfejs zaprojektowany tak, by podmiana źródła nie ruszała widoków.
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', '..', 'data', 'mock');
let cache = {};

function load(name, fallback) {
  if (cache[name]) return cache[name];
  try {
    cache[name] = JSON.parse(fs.readFileSync(path.join(DATA, `${name}.json`), 'utf8'));
  } catch {
    cache[name] = fallback;
  }
  return cache[name];
}

function recent(limit = 6) {
  return load('instagram', []).slice(0, limit);
}

function beerRatings() {
  const list = load('untappd', []);
  const map = {};
  for (const r of list) map[r.slug] = r;
  return map;
}

function clearCache() {
  cache = {};
}

module.exports = { recent, beerRatings, clearCache };
