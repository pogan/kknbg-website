# Integracje — rekomendacje dla restauracji i browaru

W prototypie wszystkie integracje są **zamockowane**, ale interfejs jest gotowy — podmiana na realne usługi
nie wymaga zmian w widokach ani w panelu.

## Google / SEO / GEO

| Narzędzie | Po co | Jak podłączyć |
|---|---|---|
| **Google Business Profile** | wizytówka w Mapach i wyszukiwarce, opinie, godziny, zdjęcia, posty | zweryfikuj lokal; spójność NAP z `Ustawienia`; link do nowej strony |
| **Google Search Console** | monitoring indeksacji, błędów, zapytań | dodaj domenę, zgłoś `sitemap.xml` |
| **Google Analytics 4 + GTM** | ruch, ścieżki, konwersje (rezerwacja, dodanie do koszyka) | wpisz ID w `Ustawienia`; zdarzenia `form_submit`, `add_to_cart` już wysyłane |
| **Google Merchant Center** | produkty sklepu w Zakupach Google | feed z `/sklep` (do dodania: `/feed/products.xml`) |
| **Reserve with Google** | rezerwacja stolika prosto z wizytówki | przez partnera rezerwacji (poniżej) |
| **Consent Mode v2** | zgodne z RODO ładowanie analityki | zaimplementowane — skrypty startują po zgodzie w banerze |

## Rezerwacje stolików

- **MojStolik.pl** (PL, popularny), **Restaumatic**, **Zenchef**, **Formitable** — widget + potwierdzenia + kaucja.
- W prototypie: formularz → zapytanie w panelu. Pole `URL widżetu rezerwacji` w `Ustawienia` — po wpisaniu
  strona `/kontakt` osadza widget zamiast formularza.

## Zamówienia i dostawa jedzenia

- Deep-linki: **Wolt**, **Pyszne.pl**, **Uber Eats** (pola w `Ustawienia`).
- Własny **click & collect** — moduł sklepu można rozszerzyć o jedzenie na wynos.

## Płatności (sklep)

- **PL**: Autopay (d. Blue Media) lub Przelewy24 — kluczowe: **BLIK**, szybkie przelewy, karty.
- **Międzynarodowe / turyści**: Stripe.
- W prototypie: `PAYMENTS_PROVIDER=mock` → symulowana bramka + webhook `/webhooks/payments/:provider`.
  Produkcyjnie: implementacja `createPayment()` w `services/payments.*` + weryfikacja podpisu w webhooku.
- **Uwaga prawna**: sprzedaż alkoholu online w PL wymaga modelu odbioru w punkcie z zezwoleniem —
  do ustalenia z prawnikiem przed uruchomieniem.

## Faktury

- **Fakturownia** / **wFirma** API — automatyczna faktura po opłaceniu zamówienia (hook w `order.service.markPaid`).

## Piwo / browar

- **Untappd** — oceny i check-iny piw przy lineupie (`/piwa`) i w sklepie. W prototypie mock (`data/mock/untappd.json`).
- **„Co teraz w tankach”** — sekcja zasilana z panelu (do dodania jako typ treści).
- **Piwo-klub / subskrypcja** — cykliczna wysyłka zestawu (rozszerzenie sklepu + płatności cykliczne).

## Wydarzenia i bilety

- **GoingApp** / **Kicket** — degustacje, zwiedzanie browaru, wieczory tematyczne. `Event` JSON-LD już generowany.

## Marketing / CRM

- Newsletter: **Brevo** lub **MailerLite** (segmenty: gość / B2B / piwo-klub). Double opt-in już zaimplementowany.
- B2B leady: formularz „gastronomia” → **Pipedrive** / **HubSpot** (webhook z `inquiry.service`).
- Heatmapy: **Microsoft Clarity** (darmowe) — pole w `Ustawienia`.
- Piksele: **Meta Pixel**, **TikTok Pixel** — pola w `Ustawienia`, ładowane po zgodzie marketingowej.

## Social media

- Feed Instagrama: **Behold** (lekki, bez logowania klienta) lub **EmbedSocial**. W prototypie mock (`data/mock/instagram.json`).
- Wydarzenia FB, „link in bio” (`/social`), dynamiczne obrazy OG (`/og/*`) — gotowe.

## Cookies / zgody

- Własny baner zgód z kategoriami (niezbędne / analityczne / marketingowe) + Consent Mode v2 — zaimplementowany.
- Alternatywa premium: **CookieYes** / **Cookiebot** (skan i katalog cookies).

## Digital signage (ekrany w lokalu)

- `/signage` + `/signage/feed.json` — jedno źródło treści dla strony i telewizorów.
- Odtwarzacz na ekran: Raspberry Pi / Android TV / Chromecast wskazujący na `https://.../signage?zone=<strefa>`.
