# Przewodnik po panelu administracyjnym

Panel: `/auth/login` → logowanie. W prototypie tryb demo (przyciski „Zaloguj jako…”).
W produkcji: logowanie Google — dostęp mają wyłącznie adresy z `ADMIN_EMAILS` w `.env`.

## Pulpit
Statystyki (menu, promocje, produkty, nowe zapytania) i szybkie akcje.

## Treść stron
Edytowalne bloki tekstu widoczne na stronie (bio, historia, oferty, teksty sekcji, strony prawne).
- **Formularzem**: `Treść stron` → wybierz blok → edytuj HTML z podglądem na żywo → „Zapisz i opublikuj”.
- **Inline na stronie**: będąc zalogowanym, otwórz stronę publiczną → pasek na dole → „Tryb edycji” → kliknij fragment.
- Wersja EN dziedziczy z PL do czasu wpisania tłumaczenia (przełącznik PL/EN w edytorze).

## Menu
Karty menu w podziale na typ (à la carte / sezonowe / grupowe / wigilijne / napoje) i język.
- **Edycja**: sekcje i pozycje (nazwa, gramatura, cena, opis, tagi wege/bezglutenowe/ostre/nowość).
  „+ Sekcja” / „+ Pozycja”, przeciąganie kolejności przez pole „kolejność”, usuwanie krzyżykiem.
- **Wersja robocza vs publikacja**: „Zapisz wersję roboczą” nie zmienia tego, co widzą goście.
  „Zapisz i opublikuj” tworzy **nową wersję** karty.
- **Historia wersji**: podgląd JSON każdej wersji, **„Przywróć”** — cofa kartę do wybranej wersji
  (publikuje ją jako nową). Nic nie ginie.
- **Status**: `opublikowane` (widoczne) / `szkic` (ukryte) / `zarchiwizowane`.

## Import menu z PDF
`Import PDF` → wgraj PDF (np. karta od kuchni) → system wyciąga tekst, wykrywa sekcje i pozycje.
1. **Przegląd**: tabela z pozycjami; kolorowe znaczniki pewności (`high` / `mid` / `low`).
   Popraw pola, przenoś pozycje między sekcjami (kolumna „Sekcja”), usuń śmieci (np. teksty marketingowe).
   Karty wielokolumnowe bywają „spłaszczane” — dlatego jest ten krok.
2. **„Zapisz poprawki”** — zapamiętuje stan przeglądu.
3. **„Utwórz menu z tych danych”** — powstaje nowe menu (wersja robocza; zaznacz „publikuj od razu”,
   jeśli ma być od razu na stronie). Oryginalny PDF podpina się pod przycisk „Pobierz PDF”.

## Promocje
- **Promo dnia** (tygodniowe): siatka pon–pt na stronie `/promocje`.
- **Promocje czasowe**: baner na stronie głównej w zadanym przedziale dat (po `Do` znikają same).
- Etykieta (`-30%`, `1+1`), opis, grafika, kolejność, włącz/wyłącz.

## Sklep — produkty
CRUD produktów (piwa: styl, ABV, IBU, pojemność, cena, stan magazynowy, zdjęcie, link Untappd).
Kategorie: `beer` / `set` / `merch` / `voucher`. „aktywny” = widoczny w sklepie.

## Sklep — zamówienia
Lista + szczegóły + zmiana statusu (`new` → `paid` → `packed` → `shipped` → `completed`).
Eksport CSV. W prototypie płatność jest symulowana; opłacone zamówienie zmniejsza stan i wysyła e-maile.

## Media
Wgrywanie zdjęć — automatycznie konwertowane do WebP w 3 rozmiarach (400/800/1400 px). Tekst alternatywny per plik.

## Zapytania
Wszystkie zgłoszenia z formularzy (kontakt, rezerwacja, event, B2B, newsletter). Filtrowanie po typie, oznaczanie „załatwione”.

## Skrzynka (outbox)
Podgląd wszystkich e-maili wysyłanych przez serwis. W prototypie to pliki `.eml` w `data/outbox/`.
W produkcji: prawdziwy SMTP / Resend / Brevo (bez zmian w panelu).

## Ustawienia
Dane firmy (NAP), godziny otwarcia, social, **identyfikatory analityki** (GA4, GTM, Meta/TikTok Pixel, Clarity —
skrypty ładują się dopiero po zgodzie w banerze cookie), feature flags (włącz/wyłącz sklep, rezerwacje, newsletter, feed IG),
URL zewnętrznego widżetu rezerwacji, linki do Wolt/Pyszne.

## Digital signage
`Ustawienia` → „Podgląd widoku ekranu” (`/signage`). To samo menu i promocje co na stronie,
w układzie pod telewizor. `?zone=bar` / `?zone=event` — różna treść na różnych ekranach.
