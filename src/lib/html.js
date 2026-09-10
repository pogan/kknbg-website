'use strict';

const sanitizeHtml = require('sanitize-html');

const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em',
  'b', 'i', 'u', 'br', 'hr', 'span', 'small', 'figure', 'figcaption', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const OPTS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    span: ['class'],
    p: ['class'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener', target: '_blank' }, true),
  },
};

/** Czyści HTML z edytora treści przed zapisem/renderem. */
function cleanHtml(dirty) {
  return sanitizeHtml(String(dirty || ''), OPTS);
}

/** Zamienia zwykły tekst na bezpieczny HTML (dla stringów z bazy). */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { cleanHtml, escapeHtml };
