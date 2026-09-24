# Lakszmi Ambasada Piękna – nowa strona (PL / EN / DE)

Nowy projekt strony salonu kosmetycznego **Lakszmi Ambasada Piękna** (ul. Poznańska 25, 87-100 Toruń).
Statyczny HTML5 + CSS + czysty JavaScript: bez frameworka i bez kroku budowania, więc strona ładuje się szybko (Core Web Vitals).

## Struktura

```
index.html              – semantyczny HTML5, polska treść w HTML (SEO), JSON-LD BeautySalon, hreflang
assets/css/styles.css   – style mobile-first (tokeny kolorów, RWD: 380 / 640 / 1024 / 1200 px)
assets/js/app.js        – i18n, cennik (zakładki + akordeony + wyszukiwarka), przed/po, mapa, menu
locales/pl.json         – słownik PL (domyślny)
locales/en.json         – słownik EN
locales/de.json         – słownik DE
data/pricing.json       – struktura cennika i ceny (nazwy usług są w słownikach)
scripts/check-i18n.mjs  – kontrola spójności kluczy PL/EN/DE i listy pozycji do uzupełnienia
```

## Uruchomienie lokalne

Słowniki i cennik są ładowane przez `fetch`, więc stronę trzeba serwować przez HTTP (nie przez `file://`):

```bash
python3 -m http.server 8080     # albo: npx serve .
# http://localhost:8080
node scripts/check-i18n.mjs     # kontrola tłumaczeń
```

## Wielojęzyczność

- Przełącznik PL / EN / DE w prawym górnym rogu nagłówka.
- Wybór jest zapamiętywany (`localStorage`) i trafia do adresu (`?lang=en`, `?lang=de`), więc link z językiem można udostępnić.
- Elementy HTML mają atrybut `data-i18n="klucz"` (tekst) albo `data-i18n-attr="atrybut:klucz"` (np. placeholder, aria-label).
- Nowy tekst dodajesz tak: klucz w **wszystkich trzech** plikach `locales/*.json`, potem `node scripts/check-i18n.mjs`.

## Cennik – jak edytować

Ceny są w `data/pricing.json`, nazwy i opisy w `locales/*.json` pod `pricing.items.<id>`.

```json
{ "id": "mani_hybrid", "price": 140, "verified": true }
```

- `price: null` wyświetla się jako „cena w salonie” / „price on request” / „Preis auf Anfrage”.
- Nowa usługa: wpis w `pricing.json` oraz `name` i `desc` w trzech słownikach.

> **Do uzupełnienia przed publikacją.** Obecna strona salonu nie była dostępna podczas tworzenia projektu.
> Potwierdzone ceny: Masaż twarzy, szyi i dekoltu – 130 zł, Manicure hybrydowy – 140 zł,
> Regulacja brwi – 35 zł, Powiększanie ust – 700 zł. Pozostałe pozycje (`"verified": false`)
> trzeba porównać z https://lakszmiambasadapiekna.pl/cennik/ i wpisać ceny 1:1.
> Listę takich pozycji wypisuje `node scripts/check-i18n.mjs`.

## Rezerwacja online

W `assets/js/app.js` ustaw `CONFIG.bookingUrl` (np. link do profilu Booksy). Wszystkie przyciski
„Zarezerwuj wizytę” (sticky header, hero, cennik, kontakt, przycisk przyklejony na dole ekranu telefonu)
otworzą ten link. Dopóki pole jest puste, przyciski dzwonią pod numer +48 533 322 533.

## Pozostałe treści zastępcze

- **Opinie** (`reviews.items` w słownikach) to przykładowe teksty. Przed publikacją zastąp je prawdziwymi opiniami z Google, Booksy lub Facebooka.
- **Przed / Po**: gradienty `.ba-img--*` w CSS to placeholdery. Wstaw prawdziwe zdjęcia salonu (WebP/AVIF, `loading="lazy"`, `width`/`height`).
- **Godziny otwarcia**: klucz `contact.hours`.

## Wydajność i dostępność

- Brak zewnętrznych bibliotek JS. Fonty Google z `display=swap` i `preconnect`.
- Mapa Google ładuje się dopiero po kliknięciu (lżejsza strona, brak cookies przed interakcją).
- Obsługa klawiatury (zakładki na strzałkach, skip-link, focus-visible), `aria-*`, `prefers-reduced-motion`.
- Bez poziomego przewijania na szerokościach od 320 px (sprawdzone w Chromium).
