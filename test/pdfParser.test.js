'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { parseMenuText, looksLikeSectionHeader } = require('../src/services/pdfParser');

const DATA = path.join(__dirname, '..', 'kk_input_data');

test('rozpoznaje nagłówki sekcji (w tym litero-spacja)', () => {
  assert.ok(looksLikeSectionHeader('PRZEKĄSKI'));
  assert.ok(looksLikeSectionHeader('S A Ł AT K I'));
  assert.ok(looksLikeSectionHeader('Z U PY'));
  assert.ok(looksLikeSectionHeader('DANIA GŁÓWNE'));
  assert.ok(!looksLikeSectionHeader('sałata rzymska, parmezan'));
  assert.ok(!looksLikeSectionHeader('Cezar 300g'));
});

test('parsuje pozycje z tekstu wzorcowego', () => {
  const sample = [
    'PRZEKĄSKI',
    'Tatar z wołowiny',
    '100g',
    'z domowymi piklami, pieczywo własnej produkcji',
    '44,9 zł',
    'Chicken Wings (8 szt.) 350g',
    'skrzydełka kurczaka w sosie BBQ',
    '36,5 zł',
    'ZUPY',
    'Żur polski z kiełbasą i jajkiem',
    '29,9 zł',
  ].join('\n');
  const r = parseMenuText(sample);
  assert.equal(r.sections.length, 2);
  const przekaski = r.sections.find((s) => /przek/i.test(s.name));
  assert.ok(przekaski);
  const tatar = przekaski.items.find((i) => /Tatar/.test(i.name));
  assert.equal(tatar.price_grosze, 4490);
  assert.equal(tatar.weight, '100g');
  const wings = przekaski.items.find((i) => /Wings/.test(i.name));
  assert.equal(wings.price_grosze, 3650);
  assert.equal(wings.weight, '350g');
});

const plPdf = path.join(DATA, 'nbg_nowe_menu_20260829_PL.pdf');
if (fs.existsSync(plPdf)) {
  test('ekstrahuje sensowną liczbę pozycji z prawdziwego PDF NBG', async () => {
    const data = await pdfParse(fs.readFileSync(plPdf));
    const r = parseMenuText(data.text);
    assert.ok(r.meta.sectionCount >= 5, `sekcje: ${r.meta.sectionCount}`);
    assert.ok(r.meta.itemCount >= 60, `pozycje: ${r.meta.itemCount}`);
    // znane pozycje
    const allItems = r.sections.flatMap((s) => s.items.map((i) => i.name.toLowerCase()));
    assert.ok(allItems.some((n) => n.includes('tatar')), 'brak tatara');
    assert.ok(allItems.some((n) => n.includes('margherita') || n.includes('cezar')), 'brak pizzy/sałatki');
  });
}
