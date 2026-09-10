'use strict';

/** Generuje proste, markowe grafiki piw (placeholdery) do sklepu. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const site = require('../src/config/site');

const OUT = path.join(__dirname, '..', 'public', 'img', 'shop');
fs.mkdirSync(OUT, { recursive: true });

const PALETTE = {
  Lager: ['#c98a3d', '#8a5a24'],
  'Cold IPA': ['#3f7d6b', '#255043'],
  Pilsner: ['#d8b23c', '#9a7c1e'],
  'Light Lager / Gluten-free': ['#e0c98a', '#b09a52'],
  'New England IPA': ['#e0973d', '#a9631c'],
  'Sour Ale': ['#c0506a', '#7e2f43'],
  'Non-alcoholic Lager': ['#9aa7a0', '#5f6b64'],
};

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

async function main() {
  for (const b of site.beers) {
    const [c1, c2] = PALETTE[b.style] || ['#b56a3d', '#8a4e2b'];
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient></defs>
      <rect width="800" height="800" fill="${c2}"/>
      <rect x="60" y="60" width="680" height="680" rx="18" fill="url(#g)"/>
      <rect x="300" y="120" width="200" height="470" rx="24" fill="#1c1a17" opacity="0.9"/>
      <rect x="300" y="90" width="70" height="60" rx="6" fill="#1c1a17" opacity="0.9"/>
      <rect x="315" y="300" width="170" height="200" rx="8" fill="#f7f4ef"/>
      <text x="400" y="345" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#1c1a17" font-weight="700">NBG</text>
      <text x="400" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#55504a">${esc(b.style.split('/')[0].trim())}</text>
      <text x="400" y="450" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#1c1a17" font-weight="700">${b.abv}%</text>
      <text x="400" y="700" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#f7f4ef" font-weight="600">${esc(b.name)}</text>
    </svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(path.join(OUT, `${b.slug}.jpg`));
    console.log('  ✔', b.slug);
  }
  // zestaw + voucher
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#2f4a3e"/><text x="400" y="380" text-anchor="middle" font-family="Georgia,serif" font-size="46" fill="#fff" font-weight="700">Zestaw</text><text x="400" y="440" text-anchor="middle" font-family="Georgia,serif" font-size="46" fill="#c9a227" font-weight="700">degustacyjny</text><text x="400" y="500" text-anchor="middle" font-family="Arial" font-size="24" fill="#d8d1c4">6 piw z piwnicy NBG</text></svg>`)).jpeg({ quality: 82 }).toFile(path.join(OUT, 'zestaw-degustacyjny-6.jpg'));
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#1c1a17"/><rect x="120" y="260" width="560" height="280" rx="16" fill="#b56a3d"/><text x="400" y="400" text-anchor="middle" font-family="Georgia,serif" font-size="46" fill="#fff" font-weight="700">Bon 100 zł</text><text x="400" y="450" text-anchor="middle" font-family="Arial" font-size="22" fill="#f7f4ef">Nowy Browar Gdański</text></svg>`)).jpeg({ quality: 82 }).toFile(path.join(OUT, 'bon-podarunkowy-100.jpg'));
  console.log('  ✔ zestaw + bon');
}

main();
