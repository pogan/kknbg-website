# Prototyp strony Nowego Browaru Gdańskiego (NBG)

## Context

Obecna strona `nowybrowargdanski.pl` stoi na WordPressie i nie spełnia oczekiwań właściciela: brak spójnego, profesjonalnego designu, menu wrzucane jako obrazki/PDF, brak sklepu, słaba integracja z SEO/GEO/social/mobile. Celem jest zbudowanie **w pełni działającego prototypu** nowej strony (własna aplikacja Node/Express), który Karol pokaże klientowi jako argument za zakupem wdrożenia. Zewnętrzne zależności (płatności, Google, social) są **zamockowane**, ale całość ma działać end‑to‑end i wyglądać jak produkt.

Decyzje klienta (Karola) z fazy planowania:
- **Języki:** pełne PL + EN (i18n z przełącznikiem, hreflang).
- **Import menu z PDF:** realne parsowanie tekstu z PDF‑ów NBG + heurystyczny detektor pozycji + tabela do akceptu/poprawek + publikacja jako nowa wersja z rollbackiem.
- **Design:** jasny, nowoczesny restart (odejście od ciemnego industrialu w stronę przewiewnego, „editorial” layoutu z mocną fotografią).
- **Repo/deploy:** commity lokalnie + push na `github.com/pogan/kknbg-website`, plus dokumentacja wdrożenia na VPS (nginx + PM2 + certbot).

Materiały wejściowe: `kk_input_data/` — logo (herb, białe PNG), 3 PDF‑y menu (PL / EN / Wigilia), zdjęcia (covers, eventy, jedzenie), wideo (hero brand `NBG_browar.mp4`, promo, pionowe pod social). Można z nich korzystać; można poprosić o więcej.

Dane firmy (z obecnej strony i PDF‑ów): ul. Jana Kilińskiego 7E, 80‑452 Gdańsk (Wrzeszcz, dawny Danziger Aktien‑Bierbrauerei, 1873). Tel. kontakt +48 731 707 177, eventy +48 881 230 302, handel/B2B +48 539 630 743. Mail `kontakt@` / `handel@nowybrowargdanski.pl`. 1200 m², ~450 miejsc, ~35 ekranów sportowych. IG `@nowybrowargdanski`, FB `NowyBrowarGdanski`. Piwa własne: Bursztynowy Lager Gdański, Katamaran Cold IPA, Artus Pils Gdański, Lager Light (bezglutenowy), Hazy IPA, Lato Sour Ale, Lager Free (bezalk.).

---

## Stack (potwierdzony + rekomendacje)

| Warstwa | Wybór | Uwaga |
|---|---|---|
| Runtime | Node.js LTS (22.x) | zgodnie z propozycją |
| Serwer | Express 5 | + `helmet`, `compression`, `express-rate-limit`, `csurf`/`csrf-csrf` |
| Widoki | EJS + `express-ejs-layouts` | HTML5 boilerplate jako baza `<head>` |
| CSS | Bootstrap 5.3 (SCSS, subset) + własny warstwowy design system | build przez `sass` + `postcss`/`autoprefixer` + `cssnano` |
| DB | SQLite (`better-sqlite3`) | migracje SQL + seed; plik w `data/` |
| Sesje | `express-session` + `connect-sqlite3` | |
| Auth | `passport` + `passport-google-oauth20` | + tryb `AUTH_MODE=mock` do demo bez kluczy Google |
| Konfiguracja | `dotenv` + walidacja (`envalid`) | `.env` / `.env.example` |
| Obrazy | `sharp` | generowanie webp/avif + rozmiarów responsywnych przy uploadzie |
| PDF | `pdf-parse` (ekstrakcja tekstu) + własny parser | `pdfjs-dist` jako fallback pozycyjny |
| Upload | `multer` | limity typu/rozmiaru |
| Mapa | Leaflet + kafelki OSM | **bez klucza API**, w pełni działa |
| i18n | `i18next` + `i18next-http-middleware` + `i18next-fs-backend` | `locales/pl.json`, `locales/en.json` |
| Mail | mock „outbox” (zapis `.eml` + widok w adminie) | interfejs gotowy pod SMTP/Resend/Brevo |
| Płatności | provider `mock` (symulacja bramki + webhook) | interfejs pod Autopay/Przelewy24/PayU/Stripe |
| Testy | `node:test` + `supertest` (smoke/API) + `@axe-core` (a11y) | |
| Proces | PM2 (`ecosystem.config.js`) | |
| CI | GitHub Actions (lint + test; deploy przez SSH jako opcja) | |

Alternatywy rozważone i **odrzucone** dla prototypu: Fastify (mniejszy ekosystem widoków), Postgres (nadmiarowy — SQLite w zupełności wystarcza dla tej skali i ułatwia backup/przenoszenie), Next.js (klient prosił o Express/EJS; SSR‑owy EJS wystarcza dla SEO).

---

## Architektura katalogów

```
kknbg-website/
  server.js                      # bootstrap, graceful shutdown
  ecosystem.config.js            # PM2
  .env.example                   # wzór; .env w .gitignore
  package.json
  src/
    app.js                       # budowa aplikacji Express (testowalna)
    config/                      # env, stałe, feature flags
    db/
      schema.sql  migrations/  seed/  index.js
    middleware/                  # auth, locale, security, errorHandler, seoLocals
    routes/
      public.js  auth.js  admin/*.js  shop.js  api.js  webhooks.js  sitemap.js
    services/
      menu.service.js  menuVersion.service.js  pdfImport.service.js
      promotions.service.js  shop.service.js  payments.mock.js
      mailer.mock.js  media.service.js  seo.service.js  settings.service.js
    lib/                         # helpery (slug, money, jsonld, ogImage)
  views/
    layouts/  partials/  pages/  admin/  shop/  emails/  errors/
  public/
    css/  js/  img/  uploads/    # uploads generowane, w .gitignore
  locales/  pl.json  en.json
  data/  kknbg.sqlite  outbox/  pdf/   # w .gitignore (poza .gitkeep)
  scripts/  import-seed-menu.js  backup-db.sh
  test/
  docs/
    DEPLOYMENT.md  ADMIN_GUIDE.md  INTEGRATIONS.md
    SELLING_POINTS.md  PRICING.md  ARCHITECTURE.md
```

---

## Model danych (SQLite — kluczowe tabele)

- **users** — `id, google_id, email, name, avatar_url, role('admin'|'user'), last_login_at, created_at`. Rola `admin` nadawana, gdy `email` ∈ `ADMIN_EMAILS` (`.env`, główny: `karol.konop@gmail.com`).
- **content_blocks** — `key, locale, title, body_html, draft_html, updated_by, updated_at`. Edytowalne fragmenty stron statycznych (bio, dojazd, B2B, teksty sekcji).
- **media** — `id, filename, variants_json, alt, width, height, mime, uploaded_by, created_at`.
- **menus** — `id, type('a_la_carte'|'seasonal'|'group'|'xmas'), locale, title, status('draft'|'published'|'archived'), current_revision_id, created_by, created_at`.
- **menu_revisions** — `id, menu_id, version, snapshot_json (sekcje+pozycje), note, source_pdf_import_id, created_by, created_at`. Publikacja = ustawienie `current_revision_id`; rollback = wskazanie starszej rewizji.
- **menu_sections / menu_items** — robocza edycja bieżącej wersji (`name, description, weight, price_grosze, tags_json[veg,gf,spicy], allergens, position`). Snapshot do rewizji przy publikacji.
- **pdf_imports** — `id, media_ref, status('uploaded'|'parsed'|'reviewed'|'applied'), raw_text, parsed_json, target_menu_id, created_by, created_at`.
- **promotions** — `id, locale, title, description, media_id, weekday(0-6|null), starts_at, ends_at, is_active, position`.
- **products** — `id, slug, name, description, style, abv, ibu, volume_ml, price_grosze, stock, media_id, untappd_url, is_active, meta_json`.
- **orders** — `id, number, email, phone, name, address_json, fulfillment('pickup'|'courier'), status('new'|'paid'|'packed'|'shipped'|'cancelled'), subtotal_grosze, shipping_grosze, total_grosze, payment_status, payment_ref, created_at`.
- **order_items** — `id, order_id, product_id, name_snapshot, unit_price_grosze, qty`.
- **inquiries** — `id, type('contact'|'b2b'|'reservation'|'event'), name, email, phone, message, meta_json, status('new'|'handled'), created_at`.
- **settings** — `key, value_json` (godziny otwarcia, adres/NAP, linki social, ID analityki, feature flags, teksty OG domyślne).
- **audit_log** — `id, user_id, action, entity, entity_id, meta_json, created_at`.
- **sessions** — zarządzane przez `connect-sqlite3`.

Kwoty trzymane w groszach (`_grosze`), formatowane helperem.

---

## Zakres funkcjonalny

### 1a. Kontent statyczny (edytowalny przez admina)
Strony: **Home**, **O Browarze** (historia + wnętrza + podziemia/fermentownia), **Piwa** (lineup z opisami; „chipy” ocen w stylu Untappd — mock), **Menu** (hub → à la carte / sezonowe / grupowe / Wigilia), **Promocje**, **Oferta dla grup i eventów** (Open Bar, Finger Food, Klasyczne, Przekąski Piwne, Biesiadne, Komunie/Chrzciny, Bufet I–IV, Imprezy okolicznościowe), **Oferta B2B / gastronomia** (piwo w kegach i puszkach, współpraca), **Sport** (35 ekranów, transmisje), **Kontakt & Rezerwacje**, **Lokalizacja/Dojazd** (Leaflet + komunikacja miejska + parking), **Sklep**, strony prawne (Polityka prywatności, Regulamin, Regulamin sklepu, Cookies).
Każda sekcja renderowana z `content_blocks` (PL/EN) z inline‑edycją dla admina (przycisk „Edytuj” → edytor treści → zapis draft → publikacja).

### 1b1. Menu (zmienny kontent)
- CRUD menu w podziale na typy, dwujęzycznie (PL/EN jako powiązane wersje).
- Sekcje + pozycje z gramaturą, ceną, tagami (wege/bezglutenowe/ostre), alergenami.
- **Wersjonowanie:** każda publikacja tworzy `menu_revision` (snapshot). Widok historii, podgląd i **rollback** jednym kliknięciem.
- Workflow: `draft` → podgląd → `publish`. Publiczne strony pokazują tylko `current_revision`.
- Widok publiczny: filtry (wege/bezgluten), kotwice sekcji, przyjazny druk, JSON‑LD `Menu`/`MenuItem`, przycisk „Pobierz PDF” (oryginał).

### 1b1+. Import menu z PDF (realny)
Pipeline: **upload PDF → ekstrakcja tekstu (`pdf-parse`) → parser heurystyczny → tabela review → korekta → „Zastosuj” → nowy `draft` menu (rewizja)**.
Parser dopasowany do układu NBG:
- Rozpoznawanie nagłówków sekcji (WERSALIKI, krótkie linie: `PRZEKĄSKI`, `ZUPY`, `BURGERY`, `PIZZA`, `DANIA GŁÓWNE`, `DODATKI`…).
- Pozycja = linia z nazwą + opcjonalna gramatura (`180g`, `±500g`, `300ml`) + cena (`38,9 zł`, `10 zł`), z opisem w kolejnych liniach do następnej ceny/nagłówka.
- Flagi: symbol „wege”, „1+1”, warianty cen (np. Cezar: kurczak/krewetki).
- Wynik: `parsed_json` z pewnością dopasowania per pozycja; w tabeli review admin poprawia/scala/usuwa/przydziela sekcję, po czym zapis do menu.
Obsługa 3 wzorców z `kk_input_data` (à la carte PL/EN, Wigilia) jako zestaw testowy parsera.

### 1b2. Promocje
- „Promo dnia” (siatka pon–pt jak w PDF) + promocje czasowe (baner na Home, strona `/promocje`).
- Harmonogram (`starts_at`/`ends_at`, `weekday`), auto‑ukrywanie po terminie, kolejność, PL/EN.

### 2a. Sklep z piwami
- Zarządzanie produktami (piwa: styl, ABV, IBU, pojemność, cena, stan, zdjęcie, link Untappd, opis).
- Storefront: lista + karta produktu (JSON‑LD `Product`+`Offer`), koszyk (sesyjny), checkout (dane, dostawa: odbiór w lokalu / kurier, zgody RODO).
- **Płatność mock:** ekran „bramki” z przyciskami *Zapłać* / *Odrzuć* → webhook → status zamówienia `paid`/`cancelled`, e‑mail do klienta i do lokalu (outbox), dekrementacja stanu.
- Panel zamówień: lista, szczegóły, zmiana statusu, eksport CSV.
- Weryfikacja wieku (18+) i informacja o zakazie sprzedaży alkoholu online w PL → prototyp z **jawnym disclaimerem** „model poglądowy; przy wdrożeniu: click&collect / sprzedaż w punkcie zgodnie z ustawą”. (Ważne prawnie — patrz uwagi.)

### A. SEO / GEO
- SSR (EJS) + per‑route `<title>`, meta description, canonical, `hreflang` pl/en/x‑default.
- JSON‑LD: `Restaurant`+`Brewery`, `LocalBusiness` (NAP, `OpeningHoursSpecification`, geo), `Menu`/`MenuItem`, `Product`/`Offer`, `BreadcrumbList`, `Organization`, `WebSite`+`SearchAction`, `Event` (degustacje/transmisje).
- `sitemap.xml` (dynamiczny, per‑locale), `robots.txt`, strona 404/410 dla starych URL‑i WP + mapa przekierowań 301.
- Wydajność / Core Web Vitals: `sharp` webp/avif + `<picture>` + `loading="lazy"`, krytyczny CSS inline, minimum JS, nagłówki cache, brotli/gzip (nginx).
- a11y WCAG AA (kontrast, landmarki, skip‑link, focus, alt‑teksty) — wspiera też SEO.
- `docs/INTEGRATIONS.md`: Google Business Profile, Search Console, Google Merchant, strategia recenzji, spójność NAP, mapy.

### B. Mobile‑first
- Bootstrap grid mobile‑first, testy 360 / 768 / 1280.
- Sticky dolny pasek CTA na mobile: **Rezerwuj · Menu · Zadzwoń**.
- Duże pola dotykowe, hamburger nav, wideo hero z `poster` + `muted playsinline` + wariant lekki.
- **PWA**: manifest + prosty service worker (offline: menu + kontakt), „Dodaj do ekranu”.

### C. OG / Social Media
- OG + Twitter Cards per route; **dynamiczny obraz OG** (`/og/:type` — SVG→`sharp`) dla menu/promocji/produktów.
- Sekcja „Instagram” (feed z lokalnego JSON — mock, interfejs pod Behold/EmbedSocial).
- Przyciski udostępniania, linki do FB/IG/TikTok, „link in bio”‑style strona `/social`.
- Osadzenie wydarzeń FB (mock), pole na Meta Pixel / TikTok Pixel w ustawieniach.

### Auth (2 poziomy)
- **user** — każdy odwiedzający, bez logowania, pełny dostęp do treści i sklepu.
- **admin** — logowanie Google OAuth; dostęp do `/admin/*` tylko dla `ADMIN_EMAILS`. Konto główne twardo w `.env`: `karol.konop@gmail.com`. Zalogowany nie‑admin → strona „brak uprawnień”.
- `AUTH_MODE=mock` → ekran „zaloguj jako” do demo bez kluczy Google (wstrzykuje `karol.konop@gmail.com`). `AUTH_MODE=google` → realny flow (klucze w `.env`).

---

## Integracje — rekomendacje (w prototypie zamockowane, interfejs gotowy)

| Obszar | Rekomendacja dla NBG | W prototypie |
|---|---|---|
| Rezerwacje stolików | MojStolik.pl / Restaumatic / Zenchef (widget + kaucja) | formularz → `inquiry` + „Reserve with Google”‑style CTA |
| Zamówienia/dostawa | deep‑linki Wolt / Pyszne.pl / Uber Eats + własny click&collect | linki + koszyk click&collect |
| Płatności | Autopay lub Przelewy24 (BLIK!) dla PL; Stripe dla EN/turystów | provider `mock` + webhook |
| Piwo (browar) | **Untappd** — oceny i check‑iny piw przy lineupie | „chipy” ocen z mock JSON |
| Bilety/eventy | GoingApp / Kicket dla degustacji i zwiedzania browaru | strona Wydarzenia + `Event` JSON‑LD |
| Recenzje | widget opinii Google + TripAdvisor | sekcja „Opinie” z mock danymi |
| Newsletter/CRM | Brevo lub MailerLite (segmenty: gość / B2B / piwo‑klub) | zapis do `inquiries`, double opt‑in mock |
| Lojalność | karty Apple/Google Wallet (stempel za wizytę) | koncept w `INTEGRATIONS.md` |
| Analityka | GA4 + GTM + Consent Mode v2 + Microsoft Clarity (heatmapy) | wstrzykiwacz z ustawień (no‑op gdy puste) |
| Zgody/cookies | CookieYes / Cookiebot + Consent Mode | własny baner zgód (kategorie) |
| Social feed | Behold (IG) — lekki, bez logowania klienta | feed z lokalnego JSON |
| Digital signage | **ten sam CMS zasila 35 ekranów** (menu/promo/wynik meczu) | endpoint `/signage/feed.json` + prosty widok `/signage` |
| B2B leady | formularz oferty gastro → CRM (Pipedrive/HubSpot) | `inquiries` typ `b2b` + panel |
| Faktury sklep | Fakturownia / wFirma API | pole `payment_ref`, hook w `payments` |
| Mapa/dojazd | Leaflet + OSM (bez kosztów) + link do Google/Apple Maps | działa realnie |

---

## Wdrożenie (docs/DEPLOYMENT.md)

- Ubuntu 24.04 LTS, Node LTS (nodesource), użytkownik `deploy`, `ufw`, `unattended-upgrades`.
- PM2: `ecosystem.config.js` (cluster/fork, `NODE_ENV=production`, `--max-memory-restart`), `pm2 startup` + `pm2 save`.
- nginx reverse proxy: `proxy_pass` na `127.0.0.1:3000`, brotli/gzip, cache statyków, nagłówki bezpieczeństwa, `client_max_body_size` dla uploadu PDF, serwowanie `/uploads` bezpośrednio.
- certbot (nginx plugin) + auto‑renew.
- Backup: `scripts/backup-db.sh` (SQLite `.backup` + rotacja) w cron; katalog `uploads` w backupie.
- Logi: `pm2-logrotate`.
- CI/CD: GitHub Actions — lint+test na PR; opcjonalny job deploy (SSH: `git pull`, `npm ci`, `npm run build`, `npm run migrate`, `pm2 reload`).
- Staging vs prod przez `.env` + osobny proces PM2.

---

## Git / GitHub

- `git init`, `.gitignore` (node_modules, `.env`, `data/*.sqlite`, `data/uploads/*`, `data/outbox/*`, `public/uploads/*`, logi).
- Commity konwencjonalne, gałąź `main`; `README.md` z instrukcją uruchomienia.
- `git remote add origin https://github.com/pogan/kknbg-website` → **push `main`** (wymaga poświadczeń GitHub Karola — użyję `gh`/HTTPS; jeśli brak auth, przygotuję commity i poproszę o `git push`).
- Tag `v0.1.0-prototype`.

---

## Wycena całkowitego wdrożenia (produkcja, nie prototyp)

Stawka blended przyjęta 180–220 PLN/h netto (senior full‑stack + design, rynek PL 2026). Zakres pełnego, produkcyjnego wdrożenia z realnymi integracjami:

| Moduł | Godz. (low–high) | Wartość netto (PLN) |
|---|---|---|
| Diagnoza, IA, architektura treści, wireframes | 20–30 | 3 900–6 300 |
| System wizualny + projekty (desktop+mobile, ~10 szablonów) | 50–70 | 9 800–15 000 |
| Front‑end (EJS/Bootstrap, RWD, animacje, PWA) | 60–90 | 11 700–19 300 |
| Rdzeń aplikacji (Express, SQLite, migracje, auth Google, hardening) | 30–45 | 5 900–9 700 |
| Panel CMS (bloki treści, media library, edytor) | 40–60 | 7 800–12 900 |
| Moduł Menu (typy, PL/EN, wersjonowanie, publikacja) | 35–50 | 6 900–10 700 |
| Import PDF (ekstrakcja, parser, review UI, mapowanie) | 30–50 | 5 900–10 700 |
| Promocje (siatka, harmonogram, banery) | 12–20 | 2 400–4 300 |
| Sklep (produkty, koszyk, checkout, zamówienia, magazyn) | 60–90 | 11 700–19 300 |
| Płatności (Autopay/P24/Stripe, webhooki, faktury) | 20–35 | 3 900–7 500 |
| SEO/GEO (schema, sitemap, hreflang, Local SEO, CWV) | 25–40 | 4 900–8 600 |
| Social/OG (dynamiczne OG, feedy, piksele) | 15–25 | 2 900–5 400 |
| Kontakt + rezerwacje (formularze, anti‑spam, integracja bookingu) | 15–25 | 2 900–5 400 |
| RODO/cookies/regulaminy + Consent Mode | 12–20 | 2 400–4 300 |
| Analityka (GA4, GTM, Search Console, Clarity) | 10–18 | 2 000–3 900 |
| i18n PL/EN (integracja; bez copywritingu) | 15–25 | 2 900–5 400 |
| Testy, QA, cross‑browser, a11y (WCAG AA) | 30–45 | 5 900–9 700 |
| DevOps (VPS, nginx, certbot, PM2, CI/CD, backupy, monitoring) | 20–35 | 3 900–7 500 |
| Migracja treści + uzupełnienie (menu, piwa, zdjęcia, redakcja) | 20–35 | 3 900–7 500 |
| Wdrożenie, launch, DNS, przekierowania z WP, szkolenie, dokumentacja | 15–25 | 2 900–5 400 |
| **Suma prac** | **~570–900 h** | **~112 000–192 000** |
| PM / komunikacja / bufor (~15%) | | +17 000–29 000 |
| **RAZEM wdrożenie** | | **~129 000–221 000 PLN netto** |

**Rekomendowany widełki do przedstawienia klientowi:** **140 000–180 000 PLN netto** dla realistycznego zakresu (design 2 rundy, sklep click&collect, 1 bramka płatności, rezerwacje przez zewnętrzny widget). Warianty:
- **MVP „strona bez sklepu”** (1a/1b + SEO/GEO/mobile/social + CMS + import PDF): **~70 000–95 000 PLN**.
- **Pełny zakres z rozbudowanym sklepem i integracją rezerwacji/POS:** górna granica tabeli.

**Koszty cykliczne:** VPS + monitoring 120–350 PLN/mies.; opieka/SLA (aktualizacje, kopie, drobne zmiany) 800–2 500 PLN/mies.; opcjonalny retainer treści/marketing wg potrzeb. Licencje integracji (rezerwacje, newsletter, feedy) 0–600 PLN/mies. zależnie od wyboru.

**Prototyp (ten etap):** ~5–8 dni roboczych. Wycena informacyjna **8 000–14 000 PLN netto**, zaliczana na poczet wdrożenia po podpisaniu umowy.

---

## Key selling points (do rozmowy z klientem) — pełna wersja w `docs/SELLING_POINTS.md`

1. **Menu bez grafika i bez czekania** — admin wrzuca PDF od kuchni, system sam wykrywa pozycje i ceny, admin tylko akceptuje. Publikacja w minuty, nie w dni.
2. **Wersjonowanie menu** — każda zmiana zapisana; powrót do poprzedniej karty jednym kliknięciem (np. po sezonie).
3. **Jeden panel, cała treść** — menu, promocje, teksty, zdjęcia, sklep, zamówienia, zapytania — bez wtyczek, bez WordPressa, bez łatania.
4. **Realny wzrost w Google i mapach** — dane strukturalne (restauracja + browar + menu + produkty), Local SEO, szybkość (Core Web Vitals), gotowość pod Google Business Profile i „Reserve with Google”.
5. **Mobile‑first** — 70%+ ruchu gastro jest mobilne; sticky „Rezerwuj / Menu / Zadzwoń”, PWA, menu offline.
6. **Social z automatu** — ładne podglądy linków (dynamiczne OG), feed Instagrama, gotowość pod piksele Meta/TikTok, strona „link in bio”.
7. **Sklep z piwem gotowy do włączenia** — produkty, koszyk, płatności, zamówienia; w prototypie na mockach, po wdrożeniu podpięcie prawdziwej bramki (BLIK) w kilka dni.
8. **Browar w centrum** — lineup piw z ocenami Untappd, „co teraz w tankach”, degustacje i zwiedzanie jako wydarzenia.
9. **Ten sam system zasila 35 ekranów** — menu i promocje na stronie = to samo na ekranach w lokalu (digital signage z jednego źródła).
10. **B2B jako kanał sprzedaży** — dedykowana oferta dla gastronomii/sieci z formularzem trafiającym prosto do CRM.
11. **Własność i niezależność** — kod na Waszym GitHubie, dane w Waszej bazie, hosting na Waszym VPS. Zero vendor lock‑in.
12. **Bezpieczeństwo i RODO** — logowanie Google, role, baner zgód z Consent Mode, regulaminy, kopie zapasowe.
13. **Dwujęzyczność PL/EN** — Wrzeszcz + turyści + goście biznesowi; poprawny `hreflang`, nie „wtyczka od tłumaczeń”.
14. **Szybkie iteracje** — architektura pod CI/CD; zmiany wdrażane bez przestojów.

---

## Fazy budowy prototypu

1. **Szkielet:** package.json, Express app, config/env, security, EJS+layouts, pipeline SCSS/Bootstrap, i18n, SQLite + schema + seed, design system (tokeny, typografia, komponenty), health‑check, `README`.
2. **Strona publiczna:** wszystkie strony statyczne z `content_blocks`, nav/stopka, Leaflet, formularze (kontakt/B2B/rezerwacja/event) → `inquiries` + outbox, baner cookies, helpery SEO + JSON‑LD, `sitemap.xml`/`robots.txt`, OG + dynamiczny obraz OG, sticky CTA mobile, PWA.
3. **Auth + panel:** Google OAuth + `AUTH_MODE=mock`, dashboard admina, edytor bloków treści (inline), media library (`sharp`).
4. **Menu:** CRUD typów, PL/EN, sekcje/pozycje, wersjonowanie + rollback, workflow publikacji, publiczne strony menu + filtry + druk + `Menu` JSON‑LD.
5. **Import PDF:** upload, ekstrakcja, parser heurystyczny (testy na 3 PDF‑ach NBG), tabela review/edycji, „Zastosuj” → nowy draft menu.
6. **Promocje:** CRUD siatki pon–pt + promocje czasowe, harmonogram, Home + `/promocje`.
7. **Sklep:** produkty CRUD, storefront, koszyk, checkout, płatność mock + webhook, panel zamówień, magazyn, e‑maile, `Product` JSON‑LD, disclaimer 18+/prawny.
8. **Integracje (mock) + ustawienia:** wstrzykiwacze analityki/pikseli, feed IG, chipy Untappd, newsletter (mock double opt‑in), endpoint `/signage/feed.json` + widok, strona `/social`.
9. **Wykończenie:** a11y (axe), wydajność (obrazy, cache, Lighthouse >90), zasianie realnej treści z `kk_input_data` (menu przez importer, piwa, zdjęcia przez `sharp`, wideo hero), strony 404/500, testy smoke + parser.
10. **Docs + Git + push + deploy:** `DEPLOYMENT.md`, `ADMIN_GUIDE.md`, `INTEGRATIONS.md`, `SELLING_POINTS.md`, `PRICING.md`, `ARCHITECTURE.md`; `ecosystem.config.js`, przykładowy `nginx.conf`, GitHub Actions; commity + push na `github.com/pogan/kknbg-website`; tag `v0.1.0-prototype`. Opcjonalnie: klientowski one‑pager (Artifact HTML) z KSP + wyceną.

---

## Weryfikacja (jak sprawdzimy, że działa)

- `cp .env.example .env` → `npm install` → `npm run seed` → `npm run dev` → `http://localhost:3000`.
- Przejście stron **PL i EN**; Lighthouse (Performance / SEO / a11y / Best Practices) — cel **>90**.
- Walidacja: `sitemap.xml`, `robots.txt`, JSON‑LD w walidatorze schema.org, poprawny `hreflang`.
- **Admin:** `AUTH_MODE=mock` → login jako `karol.konop@gmail.com`; edycja bloku treści → zmiana widoczna na froncie; nie‑admin → „brak uprawnień”.
- **Menu z PDF:** upload `kk_input_data/nbg_nowe_menu_20260829_PL.pdf` → parser zwraca pozycje z cenami → korekta w tabeli → publikacja → menu publiczne zaktualizowane → **rollback** przywraca poprzednią wersję.
- **Promocje:** dodanie promocji → widoczna na Home i `/promocje`; po `ends_at` znika.
- **Sklep:** dodanie produktu → koszyk → checkout → mock „Zapłać” → zamówienie `paid`, e‑mail w `data/outbox`, stan magazynu −1; ścieżka „Odrzuć” → `cancelled`.
- **Formularze:** wysyłka → rekord w `inquiries` + wiadomość w outbox.
- **Signage:** `/signage/feed.json` zwraca aktualne menu + promo; `/signage` renderuje widok pod ekran.
- `npm test` — zielone (smoke API + testy parsera PDF).
- RWD: 360 / 768 / 1280; sticky CTA na mobile działa.

---

## Otwarte kwestie / uwagi

- **Sprzedaż alkoholu online w PL** jest prawnie ograniczona (wymaga sprzedaży w punkcie z zezwoleniem / odbioru). Prototyp sklepu będzie **poglądowy** z widocznym disclaimerem i weryfikacją 18+; docelowy model (click&collect / „koszyk na miejscu”) do ustalenia z klientem i prawnikiem przed wdrożeniem produkcyjnym.
- **Push na GitHub** wymaga poświadczeń Karola na tej maszynie (`gh auth status` / HTTPS token). Jeśli brak — przygotuję pełną historię commitów i zdalną konfigurację, a `git push` wykona Karol jednym poleceniem.
- **Google OAuth (realny)** wymaga projektu w Google Cloud + `CLIENT_ID/SECRET`. Do prezentacji wystarcza `AUTH_MODE=mock`; realny flow będzie skonfigurowany i przetestowalny po podaniu kluczy.
- Wideo w `kk_input_data` jest ciężkie (do 260 MB) — do prototypu przygotuję skompresowane wersje web (`NBG_browar.mp4` jako hero); oryginały nie trafią do repo.
- Mogę poprosić o dodatkowe materiały: aktualne ceny/stany piw do sklepu, zdjęcia wnętrz w wysokiej rozdzielczości, teksty „O nas” w EN, logo w wersji wektorowej (SVG).
