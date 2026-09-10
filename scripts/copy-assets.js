'use strict';

/** Kopiuje statyczne zależności z node_modules do public/. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jobs = [
  ['node_modules/bootstrap/dist/js/bootstrap.bundle.min.js', 'public/js/bootstrap.bundle.min.js'],
  ['node_modules/leaflet/dist/leaflet.js', 'public/js/leaflet.js'],
  ['node_modules/leaflet/dist/leaflet.css', 'public/css/leaflet.css'],
];

for (const [src, dest] of jobs) {
  const from = path.join(root, src);
  const to = path.join(root, dest);
  if (!fs.existsSync(from)) {
    console.warn('  (pomijam, brak)', src);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log('  ✔', dest);
}

// Leaflet images (markery)
const leafletImg = path.join(root, 'node_modules/leaflet/dist/images');
if (fs.existsSync(leafletImg)) {
  const out = path.join(root, 'public/css/images');
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(leafletImg)) {
    fs.copyFileSync(path.join(leafletImg, f), path.join(out, f));
  }
  console.log('  ✔ public/css/images (leaflet markers)');
}
