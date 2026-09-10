'use strict';

const plFormatter = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** grosze (int) -> "38,90 zł" */
function formatPrice(grosze, { currency = 'zł', withCurrency = true } = {}) {
  if (grosze == null || Number.isNaN(grosze)) return '';
  const value = plFormatter.format(grosze / 100);
  return withCurrency ? `${value} ${currency}` : value;
}

/** "38,9 zł" / "38.90" / "38,90 zł" -> grosze (int) | null */
function parsePriceToGrosze(input) {
  if (input == null) return null;
  if (typeof input === 'number') return Math.round(input * 100);
  const cleaned = String(input)
    .replace(/zł|pln|,-/gi, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .trim();
  if (!cleaned || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

/** grosze -> "38.90" (dla schema.org / atrybutów) */
function toDecimalString(grosze) {
  if (grosze == null) return '';
  return (grosze / 100).toFixed(2);
}

module.exports = { formatPrice, parsePriceToGrosze, toDecimalString };
