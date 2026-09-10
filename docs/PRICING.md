# Wycena wdrożenia produkcyjnego

Stawka blended: **180–220 PLN/h netto** (senior full-stack + design, rynek PL 2026).
Zakres: pełne, produkcyjne wdrożenie z realnymi integracjami (nie prototyp).

## Rozbicie na moduły

| Moduł | Godz. (min–max) | Wartość netto (PLN) |
|---|---:|---:|
| Diagnoza, IA, architektura treści, wireframes | 20–30 | 3 900–6 300 |
| System wizualny + projekty (desktop+mobile, ~10 szablonów) | 50–70 | 9 800–15 000 |
| Front-end (EJS/Bootstrap, RWD, animacje, PWA) | 60–90 | 11 700–19 300 |
| Rdzeń aplikacji (Express, SQLite, migracje, auth Google, hardening) | 30–45 | 5 900–9 700 |
| Panel CMS (bloki treści, media library, edytor) | 40–60 | 7 800–12 900 |
| Moduł Menu (typy, PL/EN, wersjonowanie, publikacja) | 35–50 | 6 900–10 700 |
| Import PDF (ekstrakcja, parser, review UI, mapowanie) | 30–50 | 5 900–10 700 |
| Promocje (siatka, harmonogram, banery) | 12–20 | 2 400–4 300 |
| Sklep (produkty, koszyk, checkout, zamówienia, magazyn) | 60–90 | 11 700–19 300 |
| Płatności (Autopay/P24/Stripe, webhooki, faktury) | 20–35 | 3 900–7 500 |
| SEO/GEO (schema, sitemap, hreflang, Local SEO, CWV) | 25–40 | 4 900–8 600 |
| Social/OG (dynamiczne OG, feedy, piksele) | 15–25 | 2 900–5 400 |
| Kontakt + rezerwacje (formularze, anti-spam, integracja bookingu) | 15–25 | 2 900–5 400 |
| RODO/cookies/regulaminy + Consent Mode | 12–20 | 2 400–4 300 |
| Analityka (GA4, GTM, Search Console, Clarity) | 10–18 | 2 000–3 900 |
| i18n PL/EN (integracja; bez copywritingu) | 15–25 | 2 900–5 400 |
| Testy, QA, cross-browser, a11y (WCAG AA) | 30–45 | 5 900–9 700 |
| DevOps (VPS, nginx, certbot, PM2, CI/CD, backupy, monitoring) | 20–35 | 3 900–7 500 |
| Migracja treści + uzupełnienie (menu, piwa, zdjęcia, redakcja) | 20–35 | 3 900–7 500 |
| Wdrożenie, launch, DNS, przekierowania z WP, szkolenie, dokumentacja | 15–25 | 2 900–5 400 |
| **Suma prac** | **~570–900 h** | **~112 000–192 000** |
| PM / komunikacja / bufor (~15%) | | +17 000–29 000 |
| **RAZEM wdrożenie** | | **~129 000–221 000 PLN netto** |

## Rekomendacja do przedstawienia klientowi

**140 000–180 000 PLN netto** dla realistycznego zakresu:
design 2 rundy, sklep w modelu click&collect, 1 bramka płatności, rezerwacje przez zewnętrzny widget.

### Warianty

| Wariant | Zakres | Cena netto |
|---|---|---|
| **MVP „strona bez sklepu”** | 1a/1b (statyka + menu + import PDF + promocje) + SEO/GEO/mobile/social + CMS | **~70 000–95 000** |
| **Rekomendowany** | jak wyżej + sklep click&collect + 1 bramka + rezerwacje (widget) + analityka | **140 000–180 000** |
| **Pełny** | rozbudowany sklep + integracja rezerwacji/POS + moduł signage per-strefa + piwo-klub | **do 221 000** |

## Moduł digital signage (opcjonalny, wyceniany osobno)

Podstawowy widok `/signage` jest w prototypie. Produkcyjny moduł (strefy per ekran, tryb offline,
rotacja treści, wyniki meczów na żywo, panel „co na którym ekranie”): **15 000–30 000 PLN netto**.

## Koszty cykliczne

| Pozycja | Miesięcznie (netto) |
|---|---|
| VPS + monitoring + backup | 120–350 PLN |
| Opieka / SLA (aktualizacje, kopie, drobne zmiany do ~4 h) | 800–2 500 PLN |
| Licencje integracji (rezerwacje, newsletter, feed IG) | 0–600 PLN |
| Retainer treści / marketing (opcjonalnie) | wg potrzeb |

## Prototyp (ten etap)

~5–8 dni roboczych. Wycena informacyjna **8 000–14 000 PLN netto** — zaliczana na poczet wdrożenia po podpisaniu umowy.
