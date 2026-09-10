# Architektura

## Zasady

- **SSR-first** (EJS) — dobre SEO, szybki pierwszy render, minimum JS na froncie (progressive enhancement).
- **Jeden proces, jeden plik bazy** — SQLite (`better-sqlite3`, tryb WAL). Backup = kopia pliku. Bez osobnego serwera bazy.
- **Serwisy = logika, trasy = cienkie** — `src/services/*` trzymają zapytania (`db.prepare` na poziomie modułu) i reguły;
  trasy tylko walidują wejście i renderują.
- **Mock = interfejs produkcyjny** — `mailer.mock`, `payments.mock`, `instagram.service` mają API identyczne
  jak realne transporty; podmiana bez zmian w wywołaniach.
- **Treść rozdzielona od kodu** — `content_blocks` (edytowalne), `settings` (konfiguracja witryny),
  `default-content.js` (fallback). Menu/promocje/produkty w bazie.

## Warstwy

```
nginx (TLS, statyki, cache)  →  PM2 → server.js → src/app.js (Express)
                                              │
   middleware: helmet+CSP · compression · session(SQLite) · passport
               locale(/en) · i18next · rate-limit · locals
                                              │
   routes: public · auth · shop · webhooks · signage · og · sitemap · admin/*
                                              │
   services  ──►  db (SQLite)  +  data/ (outbox, pdf, mock)  +  public/uploads
```

## Model danych (SQLite)

`users` · `settings` · `content_blocks` · `media`
`menus` → `menu_sections` → `menu_items` ; `menu_revisions` (snapshot JSON, wersjonowanie) ; `pdf_imports`
`promotions`
`products` ; `orders` → `order_items`
`inquiries` · `audit_log` · `sessions` (connect-sqlite3)

Kwoty w groszach (`*_grosze`). JSON w kolumnach `*_json`. Kasowanie kaskadowe na kluczach obcych.

### Wersjonowanie menu

Publikacja = snapshot bieżącego working state (`menu_sections`/`menu_items`) do `menu_revisions.snapshot_json`
+ ustawienie `menus.current_revision_id`. Strona publiczna czyta **rewizję**, panel edytuje **working state**.
Rollback kopiuje snapshot wybranej rewizji z powrotem do working state i publikuje jako nową wersję.

## Bezpieczeństwo

- **helmet + CSP** (`middleware/security.js`) — allowlista skryptów (GTM, Leaflet z unpkg), `object-src 'none'`.
- **CSRF** — double-submit cookie (`csrf-csrf`), token w `res.locals.csrfToken`, walidacja na POST.
  Przy multipart: `multer` przed `csrfProtection` (token z `req.body`).
- **Sesje** — `express-session` + `connect-sqlite3`, `httpOnly`, `sameSite=lax`, `secure` w produkcji.
- **Rate-limit** — globalny + zaostrzony na formularzach.
- **Role** — `ensureAdmin`: `req.user.role === 'admin'` (rola z `ADMIN_EMAILS`). Zalogowany nie-admin → 403.
- **Sanityzacja** — `sanitize-html` na treści z edytora; escaping EJS domyślnie (`<%= %>`).

## i18n

Routing po prefiksie ścieżki: `/` = PL (bez prefiksu, lepsze dla SEO), `/en` = EN.
`middleware/locale.js` przepisuje `req.url`, ustawia `req.locale`, buduje `alternateUrls` (hreflang).
`i18next` + JSON (`locales/pl.json`, `en.json`). Treść długa (menu, bloki) — osobne rekordy per język.

## SEO

`lib/jsonld.js` — węzły schema.org składane per trasa (`res.locals.seo.jsonld`).
`partials/head.ejs` — `<title>`, meta, canonical, hreflang, OG/Twitter, JSON-LD.
`routes/sitemap.js` — dynamiczny `sitemap.xml` (statyczne trasy × języki + providerzy z modułów), `robots.txt`, manifest.
`lib/ogImage.js` — obrazy OG generowane `sharp` (SVG→PNG) z cache na dysku.

## Wydajność

- Bootstrap 5 — tylko potrzebne moduły (`scss/_bootstrap.scss`), reszta to własny system.
- Obrazy: `sharp` → WebP w 3 rozmiarach przy uploadzie; `<img loading="lazy">`, `<picture>` gdzie warto.
- Wideo hero: skompresowane (ffmpeg) + `poster`.
- nginx: brotli/gzip, cache statyków, serwowanie `/uploads` z pominięciem Node.
- Cache-busting: `?v=<mtime>` na CSS/JS.

## Testy

`node:test` + `supertest`. `test/pdfParser.test.js` (parser na wzorcach i 3 prawdziwych PDF-ach),
`test/smoke.test.js` (trasy publiczne, 404, auth mock, JSON-LD, hreflang, sitemap, formularz).
Schemat bazy stosowany przy `require('src/db')` — testy działają na `data/test.sqlite`.

## Świadome uproszczenia prototypu (do zmiany w produkcji)

- Express 4 zamiast 5 (stabilność ekosystemu; migracja trywialna).
- SQLite jeden proces — przy dużym ruchu / wielu instancjach: Postgres.
- Mock: płatności, poczta, Google OAuth (jest tryb realny), feed IG, Untappd.
- Sklep alkoholowy — model poglądowy; docelowo click&collect zgodny z ustawą o wychowaniu w trzeźwości.
- Parser PDF — heurystyczny; karty wielokolumnowe wymagają korekty w review UI (element zamierzony).
