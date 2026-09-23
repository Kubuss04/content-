# Everson — portal sprzedażowo-wizerunkowy (redesign premium)

Nowa odsłona strony [everson.com.pl](https://everson.com.pl/) w stylistyce **Cinematic Dark / Modern Luxury**: grafit i czerń z akcentem szczotkowanej miedzi, glassmorphism, animowane hero, doradca AI i pełny sklep (filtry, wyszukiwarka, koszyk).

## Uruchomienie

```bash
npm install        # tylko Tailwind CLI
npm run build      # kompiluje assets/css/tailwind.css (plik jest już w repo)
python3 -m http.server 8000   # lub dowolny serwer statyczny → http://localhost:8000
```

`npm run dev` przebudowuje CSS na bieżąco podczas edycji.

## Struktura

| Plik | Zawartość |
| --- | --- |
| `index.html` | Kompletny markup z klasami Tailwind: nagłówek, hero, bestsellery, kolekcje, doradca AI, „Dlaczego Everson”, o marce, opinie, galeria, stopka |
| `assets/css/styles.css` | Warstwa premium: glass, szczotkowana miedź, ziarno filmowe, animacje, reveal, szuflada, czat |
| `assets/css/tailwind.css` | Skompilowany Tailwind (generowany — nie edytuj ręcznie) |
| `assets/js/products.js` | Katalog produktów z copywritingiem + renderer makiet studyjnych SVG |
| `assets/js/app.js` | Nagłówek, autouzupełnianie, filtry/sortowanie, koszyk, szybki podgląd, animacja hero |
| `assets/js/advisor.js` | **Everson AI Advisor** — symulacja czatu (wywiad techniczny + rekomendacje w formie kart) |
| `assets/js/i18n.js` | Silnik tłumaczeń: przełącznik języka, tłumaczenie statycznego HTML, zapamiętanie wyboru |
| `assets/js/i18n-content.js` | Słowniki PL / EN / DE: teksty strony, produkty, opinie, doradca AI, film, kalkulator |
| `assets/js/cinema.js` | Film „Jak powstaje przyssawka” (5 animowanych scen), kalkulator siły trzymania, paralaksa hero |
| `assets/img/products/manifest.js` | Lista zdjęć produktów — wpisz plik, a zdjęcie zastąpi makietę w całym serwisie |
| `tailwind.config.js` | Paleta `ink` / `copper` / `bone`, fonty Fraunces + Inter |

## Przed publikacją — do uzupełnienia

- **Zdjęcia produktów:** wgraj oryginalne zdjęcia Everson (najlepiej PNG/WebP z przezroczystym tłem) do `assets/img/products/` i odkomentuj odpowiednią linię w `assets/img/products/manifest.js`. Zdjęcie pojawi się w kartach, wyszukiwarce, koszyku, szybkim podglądzie i czacie — w tym samym studyjnym kadrze co makiety. Brakujący plik automatycznie wraca do makiety. Używaj zdjęć własnych lub takich, do których Everson ma licencję (np. materiały od producentów za ich zgodą).
- **Ceny, oceny, parametry** w `products.js` są przykładowe — zastąp je danymi z systemu sprzedażowego.
- **Opinie klientów** w `app.js` są przykładowe — zastąp prawdziwymi, zweryfikowanymi opiniami (za zgodą autorów).
- **Wideo w hero (opcjonalnie):** wgraj pętlę do `assets/video/hero-loop.mp4` i ustaw `data-src` w `<video id="hero-video">`. Bez wideo działa proceduralna pętla kinowa (canvas).
- **Linki social media**, polityka prywatności i regulamin — podmień adresy w stopce.
- **Pasek branż** zastępuje logotypy partnerów — logotypy producentów dodaj tylko za ich zgodą.

## Film i kalkulator

- **„Jak powstaje przyssawka”** (`#proces`) — pięć scen: mieszanka, formowanie, wulkanizacja, kontrola, praca na linii. Sceny zmieniają się podczas przewijania; przycisk ▶ odtwarza całość jak film (oś czasu, timecode, napisy). Animacja zatrzymuje się poza ekranem.
- **Kalkulator siły trzymania** (`#kalkulator`) — trzy przypadki obciążenia (wzory w sekcji „Jak liczymy?”), wynik w N, minimalna średnica i pasujące przyssawki z katalogu; wynik można przekazać doradcy AI. Średnice czynne przyssawek: `CUP_D` w `cinema.js`.

## Wersje językowe (PL / EN / DE)

- Przełącznik w nagłówku (ikona globusa). Wybór jest zapamiętywany; link z `?lang=en` lub `?lang=de` otwiera stronę od razu w danym języku.
- Polski jest językiem źródłowym — teksty w `index.html` i `products.js` pozostają bez zmian.
- Tłumaczenia statycznego HTML: tablica `S` w `i18n-content.js` (kolumny: PL → EN → DE). Po zmianie polskiego tekstu w HTML zaktualizuj też klucz w tej tablicy.
- Elementy z atrybutem `data-i18n-skip` renderuje JavaScript (karty, koszyk, czat itd.) — ich teksty są w sekcjach `UI` i `CONTENT`.
- Wyszukiwarka znajduje produkty po nazwach i opisach we wszystkich trzech językach; doradca AI rozumie słowa kluczowe PL, EN i DE.
- Ceny pozostają w PLN, formatowane zgodnie z językiem (np. `PLN 18.90` / `18,90 PLN`).

## Podłączenie prawdziwego modelu AI

Cała logika rozmowy jest w klasie `AdvisorChat` (`assets/js/advisor.js`). Aby użyć modelu językowego, w `handleText()` wyślij wiadomość i profil (`this.profile`) do własnego endpointu po stronie serwera (nigdy z kluczem API w przeglądarce), a odpowiedź wyrenderuj przez `addBot()` / `cards()`.

## Dostępność i wydajność

- Logiczna hierarchia nagłówków (jeden H1, sekcje H2, karty H3), skip-link, `aria-live` w czacie i koszyku, pełna obsługa klawiatury (autouzupełnianie strzałkami, Esc zamyka panele).
- Kontrast tekstu dopasowany do WCAG AA na ciemnym tle.
- `prefers-reduced-motion` wyłącza animacje; animacja hero wstrzymuje się poza ekranem.
- Mobile-first, brak poziomego przewijania od 320 px.
