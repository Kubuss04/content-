# Arteria Showroom

Działające demo strony w stylu „POV: $36 000 website”: pełnoekranowa, kolorowa grafika, płynne przejścia sterowane scrollem, efekt rentgena odsłaniany linią skanera i szklane panele na wierzchu.

Cała grafika powstaje na żywo w przeglądarce (WebGL). W repozytorium nie ma ani jednego zdjęcia ani modelu 3D, więc możesz wszystko podejrzeć i zmienić w kodzie. Marka „Arteria” i jej produkty są wymyślone na potrzeby demo.

| Scena | Co pokazuje |
| --- | --- |
| 01 Aorta | makro czerwonej osłony na rozmytym tle; przyciski „Branże” płynnie zmieniają kolory tła |
| 02 Prześwietlenie | koparka w RTG ze świecącymi przewodami; scroll przesuwa linię skanera, która odsłania kolorową wersję |
| 03 Kapilara | zbliżenie na węże w oplocie; duży napis „rozciąga się” dzięki fontowi zmiennemu |
| 04 Kolory | skręcona wiązka przewodów we wszystkich kolorach palety |

Przycisk **Przegląd** u góry pokazuje wszystkie rozdziały z miniaturami renderowanymi na żywo.

## Uruchomienie

Strona to zwykłe pliki HTML, CSS i JS, bez instalowania czegokolwiek. Biblioteki ładują się z CDN (jsDelivr).

```bash
npx serve .
# albo
python3 -m http.server 8000
```

Potem otwórz adres, który wypisze terminal (np. http://localhost:3000). Dwuklik w `index.html` może nie zadziałać, bo przeglądarki blokują moduły JS otwierane jako `file://`. W VS Code wystarczy rozszerzenie Live Server.

## Jak powstają takie strony

Strona z rolki to nie jeden trik, tylko pięć warstw pracy. Najwięcej robi grafika, dopiero potem kod.

1. **Historia.** 3–5 scen, każda z jednym mocnym obrazem i jedną informacją. Scroll działa jak suwak filmu: użytkownik sam przewija opowieść.
2. **Projekt w Figmie.** Każda scena jako osobna ramka (np. 1440×900 i 390×844 na telefon). Ustal jeden font do nagłówków, jeden „techniczny” do liczb, kolory i wygląd szklanych paneli. Przejścia możesz przetestować w prototypie (Smart Animate).
3. **Grafika.** To ona robi efekt „wow”. Masz kilka dróg:
   - 3D w przeglądarce, jak w tym repo (Three.js), albo bez kodowania w Spline,
   - rendery z Blendera lub KeyShota zapisane jako zdjęcia albo krótkie wideo,
   - generatory AI: obrazy (Midjourney, Flux, Krea) i krótkie ujęcia wideo (Runway, Kling, Veo); wygeneruj od razu wersję „RTG” tego samego ujęcia,
   - zdjęcia produktów od klienta.

   Ważne, żeby wszystkie sceny miały podobne światło i kolorystykę, wtedy przejścia wyglądają jak jeden film.
4. **Kod.** Interfejs to zwykły HTML i CSS. Scrollem steruje GSAP ScrollTrigger, płynność daje Lenis, a grafikę i przejścia rysuje Three.js. Claude może napisać ten kod na podstawie projektu z Figmy (zrzuty ekranu albo serwer MCP Figmy).
5. **Szlif.** Wydajność na telefonach, wersja dla osób z wyłączonymi animacjami, plan B, gdy WebGL nie działa.

## Najważniejsze efekty i gdzie ich szukać

| Efekt | Plik | Jak działa |
| --- | --- | --- |
| Płynny scroll | `js/main.js` | Lenis wygładza przewijanie i przekazuje pozycję do ScrollTriggera |
| Choreografia scrolla | `js/story.js` | jedna oś czasu GSAP; 1 jednostka = jedna wysokość ekranu; `scrub` wiąże ją ze scrollem, więc działa też wstecz |
| Przenikanie scen | `js/webgl/composite.js` | każda scena renderuje się do osobnego bufora, shader miesza dwa bufory z najazdem kamery i rozmyciem ruchu |
| Efekt RTG | `js/webgl/materials.js` | krawędzie świecą mocniej (Fresnel), warstwy sumują się (mieszanie addytywne); tak wygląda prawdziwe zdjęcie RTG |
| Linia skanera | `js/webgl/composite.js` (tryb `SCAN`) | skośna linia z poświatą oddziela wersję RTG od kolorowej |
| Szklane panele | `css/style.css` (`.glass`) | `backdrop-filter: blur() saturate()` + półprzezroczyste tło i jasna krawędź |
| Kolory UI zależne od sceny | `js/ui/interface.js`, `css/style.css` | `data-tone="dark"` na `<html>` przełącza zmienne CSS szkła i tekstu |
| Hotspoty na modelu | `js/ui/hotspots.js` | punkt 3D rzutowany co klatkę na ekran, przycisk HTML jedzie za nim |
| „Rozciągający się” napis | `js/story.js` + `css/style.css` | GSAP animuje zmienną `--wdth`, a CSS podaje ją do `font-stretch` fontu zmiennego Archivo |
| Tekstury bez plików | `js/webgl/textures.js` | splot węża liczony w JS jako mapa wysokości, z niej mapa normalnych |
| Sceny 3D | `js/webgl/scenes/*.js` | jedna scena = jeden plik; modele złożone z prostych brył |

### Minimalny start: scroll + animacje

Tyle wystarczy, żeby dowolny element animował się w rytm scrolla:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js"></script>
<script>
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  gsap.timeline({ scrollTrigger: { trigger: '.scena', start: 'top top', end: '+=200%', scrub: true, pin: true } })
    .from('.scena h2', { y: 60, autoAlpha: 0 })
    .to('.scena img', { scale: 1.2 }, 0);
</script>
```

### Szkło

```css
.glass {
  background: rgb(248 249 247 / 0.56);
  backdrop-filter: blur(22px) saturate(1.7);
  -webkit-backdrop-filter: blur(22px) saturate(1.7);
  border: 1px solid rgb(255 255 255 / 0.6);
  border-radius: 22px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.7), 0 24px 60px -30px rgb(6 8 10 / 0.55);
}
```

### Efekt RTG na zwykłym zdjęciu (bez 3D)

Jeśli masz zdjęcie albo render, nie potrzebujesz WebGL. Kładziesz na zdjęcie jego negatyw i przesuwasz przycinanie scrollem:

```html
<div class="xray">
  <img src="maszyna.jpg" alt="Koparka">
  <img src="maszyna.jpg" alt="" class="xray-negative">
</div>

<style>
  .xray { position: relative; height: 100vh; overflow: hidden; }
  .xray img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .xray-negative {
    filter: grayscale(1) invert(1) contrast(1.4) brightness(0.9) sepia(0.35) hue-rotate(170deg) saturate(1.6);
    clip-path: inset(0 0 0 var(--scan, 0%));
  }
  .xray::after {
    content: ""; position: absolute; top: 0; bottom: 0; left: var(--scan, 0%); width: 2px;
    background: #ff8a1f; box-shadow: 0 0 24px 6px rgb(255 138 31 / 0.6);
  }
</style>

<script>
  gsap.to('.xray', {
    '--scan': '100%',
    ease: 'none',
    scrollTrigger: { trigger: '.xray', start: 'top top', end: '+=150%', scrub: true, pin: true },
  });
</script>
```

### Wideo przewijane scrollem

Popularny trik z takich stron: krótki render albo klip z AI, którego klatki „przewijasz” scrollem. Wideo trzeba zakodować tak, żeby każda klatka była kluczowa, inaczej przewijanie będzie szarpać:

```bash
ffmpeg -i ujecie.mp4 -an -vf scale=1920:-2 -c:v libx264 -g 1 -crf 23 -movflags +faststart ujecie-scroll.mp4
```

```html
<section class="film"><video src="ujecie-scroll.mp4" muted playsinline preload="auto"></video></section>
```

```js
const video = document.querySelector('.film video');
ScrollTrigger.create({
  trigger: '.film', start: 'top top', end: '+=300%', scrub: true, pin: true,
  onUpdate: (self) => { video.currentTime = self.progress * video.duration; },
});
```

## Jak zrobić z tego własną stronę

- **Teksty i dane** są w `index.html`.
- **Kolory interfejsu i fonty** są w zmiennych na początku `css/style.css`.
- **Kolejność, długość i tempo scen** zmieniasz w `js/story.js`. Każda liczba na końcu linii to moment na osi czasu (w wysokościach ekranu).
- **Wygląd scen 3D** zmieniasz w `js/webgl/scenes/`. Kolory to zwykłe wartości hex, np. `color: '#c7160c'` w `sleeve.js`.
- **Własny model 3D** (np. z Blendera, zapisany jako `.glb`) wczytasz przez GLTFLoader:

  ```js
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  const gltf = await new GLTFLoader().loadAsync('models/maszyna.glb');
  scene.add(gltf.scene);
  ```

  Dopisz wtedy do mapy importów w `index.html` linię `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"`.

## Wydajność i dostępność

To, co już jest w kodzie, a co warto zachować we własnym projekcie:

- rozdzielczość renderu dopasowuje się do ekranu i spada, gdy karta graficzna nie nadąża (`Stage.adapt` w `js/webgl/stage.js`),
- shadery kompilują się podczas ekranu ładowania, więc scroll nie przycina przy pierwszym wejściu w scenę,
- przy ustawieniu systemowym „ogranicz ruch” znika płynny scroll, falowanie kamery i pulsowanie,
- bez WebGL strona dalej działa, z kolorowymi gradientami w tle,
- gdy skrypty się nie wczytają, po kilku sekundach pojawia się zwykła, statyczna wersja treści,
- wszystkie przyciski działają z klawiatury, a okno „Przegląd” zamyka się klawiszem Esc.

## Publikacja

- **GitHub Pages:** Settings → Pages → Deploy from a branch → wybierz gałąź i folder `/ (root)`. Po minucie strona będzie pod adresem `https://<login>.github.io/<repozytorium>/`.
- **Netlify albo Vercel:** przeciągnij folder projektu na stronę Netlify Drop albo zaimportuj repozytorium w Vercel. Nie trzeba ustawiać żadnej komendy budowania.

## Prompt do Claude na start własnej wersji

```text
Zbuduj jednostronicową stronę produktową w HTML, CSS i JS (bez frameworka).
Scroll steruje historią z 4 scen: [opisz sceny]. Każda scena ma pełnoekranową grafikę
[zdjęcie / wideo / scenę Three.js] i szklane panele z informacjami (backdrop-filter).
Użyj GSAP ScrollTrigger (jedna oś czasu, scrub) i Lenis. Przejścia między scenami:
przenikanie z lekkim zoomem. W scenie 2 efekt RTG odsłaniany linią skanera.
Zadbaj o wersję na telefon, prefers-reduced-motion i wersję bez WebGL.
Projekt z Figmy w załączniku: [zrzuty ekranu albo link].
```

## Struktura plików

```text
index.html              treść strony i mapa importów bibliotek
css/style.css           wygląd interfejsu (szkło, typografia, układ na telefon)
js/main.js              start: scroll, sceny 3D, pętla animacji
js/story.js             oś czasu całej strony
js/ui/                  hotspoty, tryb „Przegląd”, pasek rozdziałów, drobne interakcje
js/webgl/stage.js       renderer, bufory scen, miniatury, adaptacja jakości
js/webgl/composite.js   shader przejść (przenikanie i skaner RTG)
js/webgl/materials.js   materiał RTG i tło z plamami światła
js/webgl/environment.js wirtualne studio fotograficzne (odbicia na lakierze i chromie)
js/webgl/geometry.js    rury, karbowane osłony, belki i zaokrąglone bryły
js/webgl/textures.js    proceduralny splot węża
js/webgl/scenes/        cztery sceny: sleeve, machine, braid, spectrum
```

## Użyte narzędzia

[Three.js](https://threejs.org) (MIT), [GSAP z ScrollTriggerem](https://gsap.com) (darmowy, także komercyjnie), [Lenis](https://lenis.darkroom.engineering) (MIT), fonty [Archivo](https://fonts.google.com/specimen/Archivo) i [Martian Mono](https://fonts.google.com/specimen/Martian+Mono) (SIL Open Font License).
