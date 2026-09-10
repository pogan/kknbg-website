'use strict';

const MAP = {
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
  'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
  'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n',
  'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z',
};

function slugify(input) {
  return String(input || '')
    .trim()
    .replace(/[Ą-ż]/g, (c) => MAP[c] || c)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

module.exports = { slugify };
