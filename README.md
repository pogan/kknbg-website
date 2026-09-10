# Nowy Browar Gdański — prototyp strony

Działający prototyp nowej strony **Nowego Browaru Gdańskiego** (restauracja + browar rzemieślniczy, Gdańsk-Wrzeszcz).
Aplikacja Node/Express + EJS + SQLite. Zewnętrzne zależności (płatności, Google OAuth, feed IG, Untappd) są **zamockowane**, ale całość działa end-to-end.

> Materiał sprzedażowy — nie jest to wersja produkcyjna. Zakres, wycena i punkty sprzedażowe: `docs/`.

## Szybki start

```bash
cp .env.example .env          # sekret sesji zostanie wygenerowany? -> ustaw ręcznie: openssl rand -hex 32
npm install
npm run build                 # kopiuje assety (Bootstrap/Leaflet), generuje grafiki, kompiluje SCSS
npm run seed                  # wypełnia bazę danymi demo (menu, promocje, produkty, treści)
npm run dev                   # http://localhost:3000  (app + watcher SCSS)
```

Panel administracyjny: **http://localhost:3000/auth/login** → „Zaloguj jako administrator”
(tryb `AUTH_MODE=mock` — bez konfiguracji Google). Główny admin: `karol.konop@gmail.com` (`.env` → `ADMIN_EMAILS`).

## Skrypty

| Komenda | Opis |
|---|---|
| `npm run dev` | serwer + watcher SCSS (nodemon + concurrently) |
| `npm start` | serwer produkcyjny |
| `npm run build` | assety + grafiki + CSS |
| `npm run seed` | dane demonstracyjne |
| `npm run reset` | usuwa bazę i odtwarza pusty schemat |
| `npm run migrate` | stosuje schemat (idempotentnie) |
| `npm test` | testy (`node:test` + supertest): parser PDF, smoke tras, SEO |

## Co jest w środku

- **Strona publiczna** (PL + EN): home z wideo hero, o browarze, menu, piwa, promocje, oferta dla grup,
  strefa sportu, B2B, kontakt + rezerwacje (Leaflet/OSM), wydarzenia, sklep, strony prawne.
- **Panel admina**: edytor treści (inline + formularz), biblioteka mediów (auto-WebP przez `sharp`),
  moduł Menu z **wersjonowaniem i rollbackiem**, **import menu z PDF** (ekstrakcja + parser + akcept),
  promocje, produkty i zamówienia sklepu, ustawienia (NAP, godziny, analityka, integracje), skrzynka „outbox”.
- **Sklep**: koszyk sesyjny, checkout (odbiór/kurier, zgody 18+/RODO), **symulowana bramka płatności** + webhook,
  potwierdzenia e-mail, magazyn, eksport CSV.
- **SEO/GEO**: SSR, JSON-LD (Restaurant/Brewery/LocalBusiness/Menu/Product/Event/FAQ), `sitemap.xml`, `robots.txt`,
  `hreflang`, dynamiczne obrazy OG, Core Web Vitals (WebP, lazy-load, cache).
- **Mobile-first**: sticky CTA (Rezerwuj/Menu/Zadzwoń), offcanvas nav, PWA (manifest + service worker).
- **Digital signage**: `/signage` + `/signage/feed.json` — te same dane co strona, widok pod telewizory w lokalu.

## Struktura

```
server.js                 bootstrap
ecosystem.config.js       PM2
src/
  config/                 env (envalid), site (NAP/nav), i18n, passport, default-content
  db/                     schema.sql, index, migrate, seed, seed-data/
  middleware/             security (helmet/CSP/CSRF/rate-limit), locale, locals, auth, errorHandler
  routes/                 public, auth, shop, webhooks, signage, sitemap, og, admin/*
  services/               menu, pdfParser, pdfImport, promotions, shop, cart, order,
                          payments.mock, mailer.mock, media, content, settings, inquiry, events, instagram
  lib/                    money, slug, html, dates, jsonld, ogImage
views/                    layouts/, partials/, pages/, admin/, shop/, errors/
public/                   css/, js/, img/, uploads/
locales/                  pl.json, en.json
docs/                     DEPLOYMENT, ADMIN_GUIDE, INTEGRATIONS, SELLING_POINTS, PRICING, ARCHITECTURE
deploy/                   nginx.conf.example
```

## Wdrożenie

VPS Ubuntu + nginx (reverse proxy) + PM2 + certbot. Instrukcja: **`docs/DEPLOYMENT.md`**.
CI: skopiuj `deploy/github-ci.yml.example` do `.github/workflows/ci.yml` (wymaga tokenu z zakresem `workflow`).

## Stack

Node LTS · Express 4 · EJS + express-ejs-layouts · SQLite (better-sqlite3) · Bootstrap 5 (subset) + własny system ·
i18next · Passport (Google OAuth) · sharp · pdf-parse · Leaflet/OpenStreetMap · helmet · csrf-csrf.
