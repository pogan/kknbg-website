'use strict';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.AUTH_MODE = 'mock';

const { createApp } = require('../src/app');
const db = require('../src/db');

// zasil testową bazę minimalnie
db.applySchema();

const app = createApp();

const PUBLIC_ROUTES = [
  '/', '/en', '/o-browarze', '/menu', '/piwa', '/promocje', '/oferta-dla-grup',
  '/sport', '/wspolpraca-b2b', '/kontakt', '/lokalizacja', '/wydarzenia', '/social',
  '/sklep', '/polityka-prywatnosci', '/regulamin', '/regulamin-sklepu',
  '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/healthz',
  '/signage', '/signage/feed.json', '/og/default.png',
];

for (const route of PUBLIC_ROUTES) {
  test(`GET ${route} -> 200`, async () => {
    const res = await request(app).get(route);
    assert.equal(res.status, 200, `${route} zwróciło ${res.status}`);
  });
}

test('404 dla nieznanej ścieżki', async () => {
  const res = await request(app).get('/nie-ma-takiej-strony-123');
  assert.equal(res.status, 404);
});

test('/admin bez logowania -> redirect', async () => {
  const res = await request(app).get('/admin');
  assert.equal(res.status, 302);
});

test('logowanie mock jako admin -> dostęp do panelu', async () => {
  const agent = request.agent(app);
  const login = await agent.get('/auth/login');
  const token = (login.text.match(/name="_csrf" value="([^"]+)"/) || [])[1];
  assert.ok(token, 'brak tokenu CSRF na stronie logowania');
  await agent.post('/auth/mock').type('form').send({ _csrf: token, as: 'admin' });
  const dash = await agent.get('/admin');
  assert.equal(dash.status, 200);
  assert.match(dash.text, /Pulpit/);
});

test('sitemap zawiera hreflang i URL menu', async () => {
  const res = await request(app).get('/sitemap.xml');
  assert.match(res.text, /hreflang="en"/);
});

test('strona główna ma JSON-LD Restaurant i canonical', async () => {
  const res = await request(app).get('/');
  assert.match(res.text, /"@type":\["Restaurant"/);
  assert.match(res.text, /<link rel="canonical"/);
  assert.match(res.text, /rel="alternate" hreflang="en"/);
});

test('formularz kontaktowy tworzy zapytanie', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/kontakt');
  const token = (page.text.match(/name="_csrf" value="([^"]+)"/) || [])[1];
  const res = await agent
    .post('/formularz/contact')
    .set('Accept', 'application/json')
    .type('form')
    .send({ _csrf: token, name: 'Test', email: 't@example.com', message: 'Wiadomość testowa' });
  assert.equal(res.status, 200);
  assert.match(res.body.text || '', /Dziękujemy/);
});
