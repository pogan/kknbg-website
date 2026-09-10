'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CACHE_DIR = path.join(__dirname, '..', '..', 'public', 'img', 'og', 'cache');
fs.mkdirSync(CACHE_DIR, { recursive: true });

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Zawija tekst do N linii po ~maxChars znaków. */
function wrap(text, maxChars, maxLines) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      lines.push(line.trim());
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, maxLines);
}

/**
 * Generuje obraz OG 1200×630 z brandingiem NBG i dynamicznym tytułem.
 * Wynik cache'owany na dysku pod kluczem.
 */
async function generate({ key, kicker = '#ChodźnaBrowar', title = 'Nowy Browar Gdański', subtitle = '' }) {
  const file = path.join(CACHE_DIR, `${key.replace(/[^a-z0-9_-]/gi, '_')}.png`);
  if (fs.existsSync(file)) return file;

  const titleLines = wrap(title, 22, 3);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#1c1a17"/>
    <rect width="1200" height="10" fill="#b56a3d"/>
    <rect x="80" y="520" width="90" height="6" fill="#c9a227"/>
    <text x="80" y="150" font-family="Inter, Arial, sans-serif" font-size="28" letter-spacing="4" fill="#c9a227">${esc(kicker.toUpperCase())}</text>
    ${titleLines
      .map((l, i) => `<text x="80" y="${250 + i * 92}" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="700" fill="#ffffff">${esc(l)}</text>`)
      .join('')}
    ${subtitle ? `<text x="80" y="${260 + titleLines.length * 92 + 30}" font-family="Inter, Arial, sans-serif" font-size="30" fill="#d8d1c4">${esc(subtitle.slice(0, 70))}</text>` : ''}
    <text x="80" y="580" font-family="Inter, Arial, sans-serif" font-size="24" fill="#9a9285">nowybrowargdanski.pl · ul. Jana Kilińskiego 7E, Gdańsk</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(file);
  return file;
}

module.exports = { generate };
