'use strict';

/**
 * Heurystyczny parser kart menu NBG (tekst z pdf-parse).
 * Zwraca { sections: [{ name, items: [{ name, weight, price_grosze, price_note, description, tags, confidence }] }], meta }.
 *
 * Zasady (dopasowane do układu kart Nowego Browaru Gdańskiego):
 *  - nagłówek sekcji: linia WERSALIKAMI (dopuszczalne spacje między literami), krótka,
 *  - pozycja: bufor linii zakończony linią z ceną ("38,9 zł", "65 zł", "38 zł"),
 *  - pierwsza linia bufora = nazwa (+ ewentualna gramatura), reszta = opis,
 *  - gramatura: "180g", "±500g", "+/- 150g", "300ml", "0,3l".
 */

const PRICE_RE = /(\d{1,4})(?:[.,](\d{1,2}))?\s*(?:zł|zl|pln)(?![a-ząćęłńóśźż])/i;
const PRICE_ONLY_LINE_RE = /^\s*(?:od\s+)?(\d{1,4})(?:[.,](\d{1,2}))?\s*(?:zł|zl|pln)\s*$/i;
const WEIGHT_RE = /(±\s?\d+\s?(?:g|kg|ml|l)(?![a-z])|\+\/-\s?\d+\s?(?:g|kg|ml|l)(?![a-z])|\b\d+(?:[.,]\d+)?\s?(?:g|kg|ml)(?![a-z])|\b\d(?:[.,]\d)?\s?l(?![a-z]))/i;

const KNOWN_SECTIONS = [
  'PRZEKĄSKI', 'ZUPY', 'SAŁATKI', 'SALATKI', 'RYBY I OWOCE MORZA', 'BURGERY', 'BURGER',
  'PIZZA', 'DANIA GŁÓWNE', 'DANIA GLOWNE', 'DLA DZIECI', 'DESERY', 'DODATKI',
  'DESKA KIBICA', 'PIWA', 'KOKTAJLE', 'WHISKY', 'WINA BIAŁE', 'WINA CZERWONE',
  'WINA MUSUJĄCE', 'DOMOWE NALEWKI', 'KAWA / HERBATA', 'SOKI / NAPOJE', 'MOKTAJLE',
  'MILK SHAKES', 'LEMONIADY', 'ROZGRZEWACZE', 'SNACKS', 'SOUPS', 'SALADS',
  'FISH AND SEA FOOD', 'MAIN COURSES', 'FOR KIDS', 'DESSERTS', 'SIDE DISHES',
  'GRILLED DISHES', 'FAN PLATTER', 'FOR YOUR PET', 'DLA TWOJEGO PUPILA',
  'ZUPA SERWOWANA', 'DANIA GŁÓWNE W STOLE', 'DODATKI DO DAŃ GŁÓWNYCH', 'NAPOJE',
  'PRZEKĄSKI ZIMNE', 'ZUPA', 'DANIE GŁÓWNE',
];

const NOISE_RE = /alergen|opłata serwisowa|serwis nie jest|suggested service|allergen|facebook\.com|instagram|nowybrowargdanski\.pl|tel\.|ul\.\s*jana|obserwuj nas|oznacz nas|#chodźnabrowar|dostępna od|available from|pizza dostępna/i;

function normalizeSpacedCaps(line) {
  const t = line.trim();
  const tokens = t.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return t;
  const longTokens = tokens.filter((x) => x.replace(/[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, '').length >= 4).length;
  const singleTokens = tokens.filter((x) => x.length === 1).length;
  // litero-spacja ("S A Ł AT K I", "Z U PY") — brak długich tokenów, min 2 pojedyncze
  if (longTokens === 0 && singleTokens >= 2) {
    return t.replace(/\s+/g, '');
  }
  return t;
}

function looksLikeSectionHeader(raw) {
  let line = normalizeSpacedCaps(raw).trim().replace(/\s+[+±]?\/?[-]?\s*\d+\s*(?:g|ml|l)\b.*$/i, '').trim();
  if (!line || line.length > 42) return false;
  const upper = line.toUpperCase();
  if (KNOWN_SECTIONS.includes(upper)) return true;
  const letters = line.replace(/[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, '');
  // same wielkie litery, min 3 litery, dozwolone spacje/myślnik/&//, brak zdania (kropka w środku), brak długich liczb
  if (
    letters.length >= 3 &&
    !/[a-ząćęłńóśźż]/.test(line) &&
    /^[A-ZĄĆĘŁŃÓŚŹŻ0-9 \-&/'"]+$/.test(line) &&
    !/\d{3,}/.test(line)
  ) {
    return true;
  }
  return false;
}

function extractWeight(text) {
  const m = text.match(WEIGHT_RE);
  return m ? m[0].replace(/\s+/g, ' ').replace('+/-', '±').trim() : '';
}

function priceToGrosze(intPart, decPart) {
  const whole = parseInt(intPart, 10) || 0;
  const cents = decPart ? parseInt(decPart.padEnd(2, '0'), 10) : 0;
  return whole * 100 + cents;
}

function detectTags(text) {
  const t = [];
  const low = text.toLowerCase();
  if (/bezglutenow|gluten-free|gluten free/.test(low)) t.push('gf');
  if (/wegetari|vegetarian|wege\b|\bveg\b/.test(low)) t.push('veg');
  if (/ostr[ey]|pikant|spicy|jalapeño|jalapeno|habanero|chilli|chili/.test(low)) t.push('spicy');
  return t;
}

function cleanName(name) {
  return name
    .replace(WEIGHT_RE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[·•]/g, '')
    .replace(/\s*,\s*$/, '')
    .trim();
}

function parseMenuText(text, { locale = 'pl' } = {}) {
  const rawLines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/ /g, ' ').trimEnd())
    .map((l) => l.trim());

  const sections = [];
  let current = null;
  let buffer = [];
  const stray = []; // pozycje bez sekcji

  const pushSection = (name) => {
    current = { name, items: [] };
    sections.push(current);
  };

  const flushItem = (priceMatch) => {
    const lines = buffer.map((l) => l.trim()).filter(Boolean);
    buffer = [];
    if (!lines.length) return;

    // linia z ceną mogła być doklejona do bufora — usuń fragment ceny z ostatniej linii
    let priceNote = '';
    let priceGrosze = null;
    if (priceMatch) {
      priceGrosze = priceToGrosze(priceMatch[1], priceMatch[2]);
    }

    // nazwa = pierwsza sensowna linia
    let nameLine = lines.shift() || '';
    // czasem gramatura jest w kolejnej krótkiej linii
    let weight = extractWeight(nameLine);
    if (!weight && lines.length && /^(?:±|\+\/-)?\s?\d+(?:[.,]\d+)?\s?(?:g|kg|ml|l)\b/i.test(lines[0])) {
      weight = extractWeight(lines.shift());
    }
    const description = lines
      .filter((l) => !PRICE_ONLY_LINE_RE.test(l))
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const name = cleanName(nameLine);
    if (!name || name.length < 2) return;

    // warianty cen: "kurczak 38 zł / krewetki 48 zł"
    const variantMatches = [...(description.matchAll(/([a-ząćęłńóśźż ]{3,}?)\s*(\d{1,3})(?:[.,](\d{1,2}))?\s*zł/gi))];
    if (!priceGrosze && variantMatches.length >= 2) {
      priceNote = variantMatches.map((m) => `${m[1].trim()} ${m[2]}${m[3] ? ',' + m[3] : ''} zł`).join(' / ');
    }

    const confidence = scoreConfidence({ name, priceGrosze, priceNote, hasSection: !!current });
    const item = {
      name,
      weight,
      price_grosze: priceGrosze,
      price_note: priceNote,
      description: priceNote ? description.replace(/([a-ząćęłńóśźż ]{3,}?)\s*\d{1,3}(?:[.,]\d{1,2})?\s*zł/gi, '').replace(/\s{2,}/g, ' ').trim() : description,
      tags: detectTags(`${name} ${description}`),
      confidence,
    };
    (current ? current.items : stray).push(item);
  };

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    if (!line) continue;
    if (NOISE_RE.test(line)) continue;

    if (looksLikeSectionHeader(line)) {
      // domknij ewentualny bufor bez ceny jako opis-śmieć — pomijamy
      buffer = [];
      const name = titleCaseSection(normalizeSpacedCaps(line).replace(/\s+\d+\s*(?:g|ml|l)\b.*$/i, '').trim());
      pushSection(name);
      continue;
    }

    buffer.push(line);
    const pm = line.match(PRICE_RE);
    if (pm && (PRICE_ONLY_LINE_RE.test(line) || /zł\s*$/i.test(line))) {
      // usuń część cenową z ostatniej linii bufora, jeśli doklejona do tekstu
      buffer[buffer.length - 1] = line.replace(PRICE_RE, '').trim();
      flushItem(pm);
    }
  }

  // pozycje bez sekcji -> sekcja "Pozostałe"
  if (stray.length) {
    sections.push({ name: locale === 'en' ? 'Other' : 'Pozostałe', items: stray });
  }

  let cleaned = sections.filter((s) => s.items.length);

  // Fallback dla kart bez cen per-pozycja (np. menu wigilijne / biesiadne):
  // jeśli prawie nic nie znaleziono, potnij tekst po nagłówkach i potraktuj
  // każdą grupę linii jako pozycję bez ceny.
  const totalItems = cleaned.reduce((n, s) => n + s.items.length, 0);
  const pricedItems = cleaned.reduce((n, s) => n + s.items.filter((i) => i.price_grosze != null || i.price_note).length, 0);
  if (pricedItems < 3) {
    const fb = parseNoPriceMenu(rawLines, locale);
    const fbItems = fb.reduce((n, s) => n + s.items.length, 0);
    if (fbItems >= Math.max(6, totalItems * 2)) cleaned = fb;
  }

  return {
    sections: cleaned,
    meta: {
      sectionCount: cleaned.length,
      itemCount: cleaned.reduce((n, s) => n + s.items.length, 0),
      lowConfidence: cleaned.reduce((n, s) => n + s.items.filter((it) => it.confidence === 'low').length, 0),
    },
  };
}

/** Parser zapasowy: karty prix-fixe bez cen przy pozycjach. */
function parseNoPriceMenu(lines, locale) {
  const sections = [];
  let current = null;
  const priceAtLineEnd = /(\d{1,4})(?:[.,]\d{1,2})?\s*(?:zł|zl|pln)(?:\s*\/\s*os\.?)?/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || NOISE_RE.test(line)) continue;
    if (looksLikeSectionHeader(line) || /^menu\b/i.test(line) && line.length < 60) {
      current = { name: titleCaseSection(normalizeSpacedCaps(line).replace(/\s{2,}/g, ' ').trim()), note: '', items: [] };
      // cena pakietu w nagłówku -> notka sekcji
      const pm = line.match(priceAtLineEnd);
      if (pm) current.note = line.slice(line.indexOf(pm[0])).trim();
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { name: locale === 'en' ? 'Menu' : 'Menu', note: '', items: [] };
      sections.push(current);
    }
    // podziel linię na pozycje po " · " lub " / " lub "lub"
    const parts = line.split(/\s+·\s+|\s+•\s+|\s{2,}|\s+lub\s+/i).map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      if (p.length < 3 || p.length > 160) continue;
      const priceM = p.match(priceAtLineEnd);
      sections[sections.length - 1].items.push({
        name: p.replace(priceAtLineEnd, '').replace(/[·•,]\s*$/, '').trim(),
        weight: extractWeight(p),
        price_grosze: null,
        price_note: priceM ? priceM[0] : '',
        description: '',
        tags: detectTags(p),
        confidence: 'mid',
      });
    }
  }
  return sections.filter((s) => s.items.length);
}

function scoreConfidence({ name, priceGrosze, priceNote, hasSection }) {
  let score = 0;
  if (priceGrosze != null || priceNote) score += 2;
  if (hasSection) score += 1;
  if (name && name.length >= 3 && name.length <= 45 && /^[\p{Lu}0-9]/u.test(name)) score += 1;
  const words = name.split(/\s+/).length;
  if (words > 7) score -= 2; // za długa nazwa = pewnie fragment opisu
  if (name.length > 60) score -= 2;
  if (/^(z |w |na |do |sos |podawan|serwowan|bułka|śwież|wywar|ryba w|burger woł|kremow|nasza |powstaje)/i.test(name)) score -= 3;
  if (/,\s*$/.test(name) || /[a-ząćęłńóśźż]{2}[A-ZĄĆĘŁŃÓŚŹŻ]/.test(name)) score -= 1; // sklejone słowa
  if (score >= 3) return 'high';
  if (score >= 1) return 'mid';
  return 'low';
}

function titleCaseSection(s) {
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

module.exports = { parseMenuText, looksLikeSectionHeader, extractWeight, PRICE_RE };
