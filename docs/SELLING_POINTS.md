# Key selling points — do rozmowy z klientem (NBG)

Argumenty do przedstawienia właścicielowi Nowego Browaru Gdańskiego razem z prototypem.
Każdy punkt ma odpowiednik „na żywo” w prototypie.

## 1. Menu bez grafika i bez czekania
Admin wgrywa PDF od kuchni → system sam wykrywa pozycje, gramaturę i ceny → admin tylko akceptuje i publikuje.
Dziś: menu jako obrazek/PDF, każda zmiana ceny to zlecenie do grafika. Nowa strona: publikacja w minuty.
**Demo:** panel → Import PDF → wgraj `nbg_nowe_menu_20260829_PL.pdf`.

## 2. Wersjonowanie menu
Każda publikacja zapisana. Powrót do poprzedniej karty jednym kliknięciem (np. po sezonie, po pomyłce).
**Demo:** panel → Menu → dowolna karta → „Historia wersji” → „Przywróć”.

## 3. Jeden panel, cała treść
Menu, promocje, teksty, zdjęcia, sklep, zamówienia, zapytania — bez wtyczek, bez WordPressa, bez łatania i aktualizacji.

## 4. Realny wzrost w Google i Mapach
Dane strukturalne (restauracja + browar + menu + produkty + wydarzenia + FAQ), Local SEO, `hreflang`,
szybkość (Core Web Vitals), gotowość pod Google Business Profile i „Reserve with Google”.
**Demo:** widok źródła strony → bloki `application/ld+json`; `/sitemap.xml`; test w walidatorze schema.org.

## 5. Mobile-first
70%+ ruchu gastronomicznego jest mobilne. Sticky pasek „Rezerwuj / Menu / Zadzwoń”, PWA (dodaj do ekranu),
menu dostępne offline.

## 6. Social z automatu
Ładne podglądy linków (dynamiczne obrazy OG dla menu, promocji, produktów), feed Instagrama na stronie,
strona „link in bio” (`/social`), gotowość pod piksele Meta/TikTok.

## 7. Sklep z piwem gotowy do włączenia
Produkty, koszyk, checkout, zamówienia, magazyn, potwierdzenia e-mail. W prototypie na symulowanej płatności;
po wdrożeniu podpięcie prawdziwej bramki (BLIK) to kilka dni.
**Demo:** `/sklep` → koszyk → zamówienie → „Zapłać” (symulacja) → potwierdzenie + e-mail w panelu → stan magazynu −1.

## 8. Browar w centrum
Lineup piw z ocenami Untappd, miejsce na „co teraz w tankach”, degustacje i zwiedzanie jako wydarzenia z biletami.

## 9. Ten sam system zasila ekrany w lokalu
Menu i promocje wpisane raz w panelu = to samo na telewizorach (digital signage z jednego źródła).
**Demo:** `/signage` w trybie pełnoekranowym.

## 10. B2B jako kanał sprzedaży
Dedykowana oferta dla gastronomii i sieci z formularzem trafiającym prosto do skrzynki / CRM.

## 11. Własność i niezależność
Kod na Waszym GitHubie, dane w Waszej bazie, hosting na Waszym VPS. Zero vendor lock-in, zero abonamentu za CMS.

## 12. Bezpieczeństwo i RODO
Logowanie Google z rolami, baner zgód z Google Consent Mode v2, regulaminy, kopie zapasowe, hardening (CSP, CSRF, rate-limit).

## 13. Dwujęzyczność PL / EN
Wrzeszcz + turyści + goście biznesowi. Poprawny `hreflang`, osobne treści — nie „wtyczka od tłumaczeń”.

## 14. Szybkie iteracje
CI (testy na każdą zmianę), wdrożenia bez przestoju (`pm2 reload`), prosta architektura = tani rozwój.
