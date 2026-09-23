/* ==========================================================================
   Everson — katalog produktów + renderer makiet studyjnych (SVG)
   --------------------------------------------------------------------------
   Każdy produkt może mieć pole `image` (np. "assets/img/products/ev-flat.webp").
   Jeśli je ustawisz, karta pokaże oryginalne zdjęcie Everson w tym samym
   studyjnym kadrze (tło, światło, cień). Bez `image` rysowana jest wektorowa
   makieta produktu, więc strona wygląda spójnie od pierwszego uruchomienia.

   UWAGA: ceny i oceny poniżej to wartości przykładowe — przed publikacją
   zastąp je danymi z systemu sprzedażowego Everson.
   ========================================================================== */

window.EVERSON = window.EVERSON || {};

EVERSON.categories = [
  { id: "all", label: "Wszystkie" },
  { id: "przyssawki", label: "Przyssawki próżniowe" },
  { id: "chwytaki", label: "Chwytaki do butelek" },
  { id: "generatory", label: "Generatory podciśnienia" },
  { id: "bloki", label: "Bloki podciśnieniowe" },
  { id: "weze", label: "Węże próżniowe" },
  { id: "maty", label: "Maty ssące" },
];

EVERSON.industries = {
  opakowania: "Opakowania i logistyka",
  szklo: "Szkło i kamień",
  drewno: "Drewno i meble",
  elektronika: "Elektronika",
  fotowoltaika: "Fotowoltaika",
  spozywczy: "Przemysł spożywczy",
  kompozyty: "Kompozyty i tworzywa",
  metal: "Obróbka blach",
  motoryzacja: "Motoryzacja",
};

EVERSON.products = [
  {
    id: "ev-flat-40",
    name: "EV-Flat SPF 40",
    category: "przyssawki",
    shape: "flat",
    rubber: "#1d1d21",
    material: "NBR",
    temp: [-10, 70],
    diameter: "Ø 40 mm",
    industries: ["szklo", "metal", "motoryzacja"],
    surfaces: ["gladka"],
    conditions: ["standard"],
    tier: 1,
    price: 18.9,
    rating: 4.9,
    reviews: 214,
    bestseller: true,
    headline: "Chwyt, który nie odpuszcza.",
    benefit: "Płaska geometria o bardzo krótkim skoku — maksymalna siła trzymania i precyzja pozycjonowania na szkle i blasze.",
    description:
      "Precyzyjnie formowana warga i usztywniona podpora eliminują przesunięcia boczne nawet przy dynamicznych ruchach robota. Mieszanka NBR o wysokiej odporności na ścieranie pracuje dziesiątki tysięcy cykli bez utraty szczelności — mniej przestojów, mniej wymian, stała jakość odkładania.",
    specs: { "Średnica": "40 mm", "Materiał": "NBR 60 Shore A", "Temperatura": "-10 … +70 °C", "Przyłącze": "G1/8\" wew.", "Siła trzymania": "ok. 75 N przy -0,6 bar" },
  },
  {
    id: "ev-bellow-25",
    name: "EV-Bellow SPB 2.5",
    category: "przyssawki",
    shape: "bellows",
    folds: 3,
    rubber: "#2a2a30",
    material: "NBR / PU",
    temp: [-20, 80],
    diameter: "Ø 32 mm",
    industries: ["opakowania", "spozywczy", "motoryzacja"],
    surfaces: ["nierowna", "gladka"],
    conditions: ["standard"],
    tier: 1,
    price: 24.5,
    rating: 4.8,
    reviews: 187,
    bestseller: true,
    headline: "Elastyczność w każdym ruchu.",
    benefit: "2,5 fałdy kompensują różnice wysokości i nachylenia — idealna do kartonów, folii i elementów o nieregularnym kształcie.",
    description:
      "Mieszek pracuje jak amortyzator: łagodnie przejmuje detal, kompensuje tolerancje i delikatnie go unosi. Dzięki efektowi podnoszenia przy zasysaniu skracasz cykl bez dodatkowego skoku osi. Wzmocniona warga zachowuje szczelność na lekko pofałdowanych powierzchniach.",
    specs: { "Średnica": "32 mm", "Liczba fałd": "2,5", "Materiał": "NBR / PU", "Temperatura": "-20 … +80 °C", "Kompensacja skoku": "do 14 mm" },
  },
  {
    id: "ev-foam-60",
    name: "EV-Foam FL 60",
    category: "przyssawki",
    shape: "foam",
    rubber: "#26262b",
    material: "Guma + pianka EPDM",
    temp: [-30, 90],
    diameter: "Ø 60 mm",
    industries: ["drewno", "szklo", "kompozyty"],
    surfaces: ["strukturalna", "nierowna"],
    conditions: ["standard"],
    tier: 2,
    price: 42.0,
    rating: 4.9,
    reviews: 96,
    bestseller: true,
    headline: "Szczelność tam, gdzie inne zawodzą.",
    benefit: "Warga piankowa wypełnia rowki i struktury — pewny chwyt na drewnie, płytach ryflowanych i szkle ornamentowym.",
    description:
      "Miękka, zamkniętokomórkowa pianka dopasowuje się do mikro- i makrostruktury powierzchni, tworząc szczelną komorę tam, gdzie klasyczna przyssawka traci podciśnienie. Wymienny pierścień piankowy obniża koszt eksploatacji — zmieniasz tylko zużywającą się część, nie cały chwytak.",
    specs: { "Średnica": "60 mm", "Warga": "Pianka EPDM, wymienna", "Temperatura": "-30 … +90 °C", "Przyłącze": "G1/4\" wew.", "Zastosowanie": "Powierzchnie strukturalne" },
  },
  {
    id: "ev-heat-50",
    name: "EV-HeatPro HT 50",
    category: "przyssawki",
    shape: "flat",
    rubber: "#8d3a26",
    material: "Silikon HT",
    temp: [-40, 250],
    diameter: "Ø 50 mm",
    industries: ["szklo", "motoryzacja", "metal", "kompozyty"],
    surfaces: ["gladka"],
    conditions: ["temperatura"],
    tier: 2,
    price: 58.0,
    rating: 4.8,
    reviews: 61,
    headline: "Stworzona do pracy w ogniu.",
    benefit: "Silikon wysokotemperaturowy utrzymuje elastyczność do +250 °C — pewny transport wyprasek prosto z formy i pieca.",
    description:
      "Tam, gdzie standardowa guma twardnieje i pęka, HeatPro zachowuje sprężystość i szczelność. Przenosisz detale bez czekania na ich wystygnięcie, skracając czas cyklu na liniach formowania, hartowania i termoformowania.",
    specs: { "Średnica": "50 mm", "Materiał": "Silikon HT", "Temperatura": "-40 … +250 °C", "Przyłącze": "G1/4\" zew.", "Zastosowanie": "Gorące wypraski, szkło hartowane" },
  },
  {
    id: "ev-wafer-20",
    name: "EV-Wafer SX 20",
    category: "przyssawki",
    shape: "wafer",
    rubber: "#3b5f86",
    material: "Silikon bez śladów",
    temp: [-30, 180],
    diameter: "Ø 20 mm",
    industries: ["fotowoltaika", "elektronika"],
    surfaces: ["delikatna", "gladka"],
    conditions: ["czystosc"],
    tier: 3,
    price: 36.0,
    rating: 5.0,
    reviews: 44,
    headline: "Precyzja na poziomie mikronów.",
    benefit: "Niski profil i materiał niepozostawiający śladów — bezpieczne przenoszenie ogniw PV i płytek krzemowych.",
    description:
      "Ultrapłaska konstrukcja z żebrowanym wsparciem rozkłada siłę na całą powierzchnię styku, chroniąc cienkie, kruche podłoża przed mikropęknięciami. Mieszanka nie migruje na detal, więc powierzchnia pozostaje czysta — bez odcisków i przebarwień.",
    specs: { "Średnica": "20 mm", "Materiał": "Silikon, non-marking", "Temperatura": "-30 … +180 °C", "Wysokość": "4,5 mm", "Zastosowanie": "Ogniwa PV, wafle, PCB" },
  },
  {
    id: "ev-food-30",
    name: "EV-Food FD 30",
    category: "przyssawki",
    shape: "bellows",
    folds: 2,
    rubber: "#2d6cb5",
    material: "Silikon spożywczy",
    temp: [-40, 200],
    diameter: "Ø 30 mm",
    industries: ["spozywczy", "opakowania"],
    surfaces: ["delikatna", "nierowna"],
    conditions: ["zywnosc"],
    tier: 2,
    price: 31.5,
    rating: 4.9,
    reviews: 73,
    headline: "Higiena, którą widać.",
    benefit: "Niebieski, wykrywalny wizualnie silikon do kontaktu z żywnością — bezpieczne pick & place słodyczy, pieczywa i opakowań jednostkowych.",
    description:
      "Kolor kontrastowy ułatwia kontrolę jakości, a gładka, łatwozmywalna powierzchnia skraca procedury sanitacji. Miękkie fałdy chwytają delikatne produkty bez odkształceń — idealne dla robotów delta pracujących z wysoką wydajnością.",
    specs: { "Średnica": "30 mm", "Materiał": "Silikon do kontaktu z żywnością", "Temperatura": "-40 … +200 °C", "Liczba fałd": "1,5", "Kolor": "Niebieski (detekcja wizualna)" },
  },
  {
    id: "ev-oval-2060",
    name: "EV-Oval SO 20×60",
    category: "przyssawki",
    shape: "oval",
    rubber: "#1f1f24",
    material: "NBR",
    temp: [-10, 70],
    diameter: "20 × 60 mm",
    industries: ["elektronika", "kompozyty", "drewno", "metal"],
    surfaces: ["gladka", "strukturalna"],
    conditions: ["standard"],
    tier: 1,
    price: 29.0,
    rating: 4.7,
    reviews: 58,
    headline: "Stworzona do wąskich detali.",
    benefit: "Owalny kształt maksymalizuje powierzchnię ssania na profilach, listwach i wąskich panelach.",
    description:
      "Tam, gdzie okrągła przyssawka nie mieści się na detalu, owal daje nawet trzykrotnie większą powierzchnię czynną. Stabilizujące żebra zapobiegają obrotowi elementu — idealnie przy szybkim transferze profili i listew.",
    specs: { "Wymiar": "20 × 60 mm", "Materiał": "NBR", "Temperatura": "-10 … +70 °C", "Przyłącze": "M5 zew.", "Zastosowanie": "Profile, listwy, panele" },
  },
  {
    id: "ev-bottle-bg3",
    name: "EV-Bottle BG 3",
    category: "chwytaki",
    shape: "bottle",
    rubber: "#232328",
    material: "Guma naturalna / NBR",
    temp: [-10, 70],
    diameter: "Szyjki 20–32 mm",
    industries: ["opakowania", "spozywczy"],
    surfaces: ["nierowna"],
    conditions: ["standard", "zywnosc"],
    tier: 2,
    price: 89.0,
    rating: 4.8,
    reviews: 52,
    bestseller: true,
    headline: "Butelki w ruchu. Bez ani jednej straty.",
    benefit: "Pneumatyczny chwytak obejmujący szyjkę — bezpieczne pakowanie i przepakowywanie butelek PET i szklanych.",
    description:
      "Elastyczna membrana równomiernie oplata szyjkę, chroniąc nakrętkę i etykietę. Jeden rozmiar obsługuje szeroki zakres średnic, więc przezbrojenie linii przy zmianie formatu trwa minuty, nie godziny.",
    specs: { "Zakres szyjek": "20–32 mm", "Materiał": "NR / NBR", "Ciśnienie robocze": "0,5–1,5 bar", "Zastosowanie": "PET, szkło, puszki" },
  },
  {
    id: "ev-gen-vg15",
    name: "EV-Gen VG 15",
    category: "generatory",
    shape: "generator",
    material: "Aluminium anodowane",
    temp: [0, 60],
    diameter: "Dysza 1,5 mm",
    industries: ["opakowania", "motoryzacja", "metal", "szklo", "drewno", "elektronika"],
    surfaces: [],
    conditions: ["standard"],
    tier: 2,
    price: 249.0,
    rating: 4.9,
    reviews: 128,
    bestseller: true,
    headline: "Serce Twojego systemu próżni.",
    benefit: "Wielostopniowy ejektor zapewnia szybkie zasysanie przy nawet 40% niższym zużyciu sprężonego powietrza.",
    description:
      "Precyzyjnie obrobione dysze pracują stopniowo, generując wysoki przepływ na starcie i głębokie podciśnienie na końcu cyklu. Cicha praca, brak części ruchomych i kompaktowa obudowa oznaczają bezobsługowe lata pracy przy znacząco niższych kosztach energii.",
    specs: { "Dysza": "1,5 mm", "Podciśnienie max": "-0,9 bar", "Zużycie powietrza": "ok. 90 Nl/min", "Poziom hałasu": "< 62 dB(A)", "Korpus": "Aluminium anodowane" },
  },
  {
    id: "ev-block-vb4",
    name: "EV-Block VB 4",
    category: "bloki",
    shape: "block",
    material: "Aluminium + zawory",
    temp: [0, 60],
    diameter: "4 obwody",
    industries: ["opakowania", "drewno", "metal", "motoryzacja"],
    surfaces: [],
    conditions: ["standard"],
    tier: 3,
    price: 689.0,
    rating: 4.7,
    reviews: 31,
    headline: "Pełna kontrola. Jeden moduł.",
    benefit: "Kompaktowy blok z czterema niezależnymi obwodami — rozdzielasz podciśnienie i nadzorujesz każdy chwytak osobno.",
    description:
      "Zintegrowane zawory i przyłącza redukują liczbę złączek i punktów nieszczelności. Modułowa konstrukcja pozwala rozbudować układ razem z linią, a czytelny układ przyłączy skraca czas montażu i serwisu.",
    specs: { "Obwody": "4 niezależne", "Przyłącza": "G1/4\"", "Sterowanie": "24 V DC", "Korpus": "Aluminium anodowane", "Montaż": "Szyna DIN / płyta" },
  },
  {
    id: "ev-hose-pu86",
    name: "EV-Hose PU 8/6",
    category: "weze",
    shape: "hose",
    material: "Poliuretan",
    temp: [-20, 60],
    diameter: "8 × 6 mm",
    industries: ["opakowania", "motoryzacja", "metal", "elektronika", "spozywczy"],
    surfaces: [],
    conditions: ["standard"],
    tier: 1,
    price: 6.9,
    unit: "mb",
    rating: 4.8,
    reviews: 302,
    headline: "Przepływ bez kompromisów.",
    benefit: "Odporny na zagniecenia poliuretan zachowuje przekrój pod podciśnieniem — pełna wydajność na całej długości.",
    description:
      "Wąż nie zapada się przy głębokim podciśnieniu i nie pęka przy ciągłym zginaniu w prowadnikach robota. Gładka ścianka wewnętrzna minimalizuje straty przepływu, a wysoka elastyczność ułatwia prowadzenie w ciasnych przestrzeniach.",
    specs: { "Wymiar": "8 × 6 mm", "Materiał": "PU 98 Shore A", "Temperatura": "-20 … +60 °C", "Sprzedaż": "Na metry bieżące" },
  },
  {
    id: "ev-mat-sm600",
    name: "EV-Mat SM 600",
    category: "maty",
    shape: "mat",
    material: "Guma perforowana",
    temp: [-10, 80],
    diameter: "600 × 400 mm",
    industries: ["drewno", "kompozyty", "szklo", "elektronika"],
    surfaces: ["strukturalna", "delikatna", "gladka"],
    conditions: ["standard"],
    tier: 3,
    price: 390.0,
    rating: 4.8,
    reviews: 27,
    headline: "Cała płaszczyzna pod kontrolą.",
    benefit: "Perforowana mata ssąca mocuje arkusze i formatki bez zacisków — równomiernie, bez odkształceń i śladów.",
    description:
      "Setki mikrootworów rozkładają podciśnienie na całej powierzchni, dzięki czemu cienkie arkusze leżą idealnie płasko podczas obróbki, cięcia czy kontroli. Mata daje się przycinać do formatu stołu, a jej elastyczna struktura chroni delikatne powierzchnie.",
    specs: { "Wymiar": "600 × 400 mm", "Grubość": "5 mm", "Materiał": "Guma perforowana", "Temperatura": "-10 … +80 °C", "Obróbka": "Możliwość przycięcia" },
  },
];

/* ---------------- Formatowanie ---------------- */
EVERSON.formatPrice = (value) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 2 }).format(value);

EVERSON.getProduct = (id) => EVERSON.products.find((p) => p.id === id);

EVERSON.starsSvg = (rating, size = 14) => {
  const full = Math.round(rating * 2) / 2;
  let out = "";
  for (let i = 1; i <= 5; i++) {
    const fill = i <= full ? "currentColor" : i - 0.5 === full ? "url(#half-star)" : "none";
    out += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linejoin="round" d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></svg>`;
  }
  return `<span class="inline-flex items-center gap-0.5 text-copper-300" role="img" aria-label="Ocena ${rating.toString().replace(".", ",")} na 5">${out}</span>`;
};

/* ==========================================================================
   Renderer makiet studyjnych
   ========================================================================== */
EVERSON.renderVisual = (() => {
  let uid = 0;

  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  };

  const defs = (id, rubber) => `
    <defs>
      <linearGradient id="metal-${id}" x1="0" x2="1">
        <stop offset="0" stop-color="#5b5b62"/><stop offset=".22" stop-color="#d9d9de"/>
        <stop offset=".45" stop-color="#8b8b93"/><stop offset=".62" stop-color="#f1f1f4"/>
        <stop offset="1" stop-color="#4a4a51"/>
      </linearGradient>
      <linearGradient id="brass-${id}" x1="0" x2="1">
        <stop offset="0" stop-color="#6d4a2e"/><stop offset=".3" stop-color="#e9b893"/>
        <stop offset=".55" stop-color="#a86a41"/><stop offset=".75" stop-color="#f3d3b6"/>
        <stop offset="1" stop-color="#5a3a22"/>
      </linearGradient>
      <linearGradient id="rub-${id}" x1="0" x2="1">
        <stop offset="0" stop-color="${shade(rubber, -18)}"/><stop offset=".35" stop-color="${shade(rubber, 38)}"/>
        <stop offset=".55" stop-color="${rubber}"/><stop offset="1" stop-color="${shade(rubber, -30)}"/>
      </linearGradient>
      <radialGradient id="rubtop-${id}" cx=".4" cy=".35" r=".8">
        <stop offset="0" stop-color="${shade(rubber, 55)}"/><stop offset=".6" stop-color="${rubber}"/>
        <stop offset="1" stop-color="${shade(rubber, -25)}"/>
      </radialGradient>
      <linearGradient id="alu-${id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#e7e7ec"/><stop offset=".5" stop-color="#9c9ca6"/><stop offset="1" stop-color="#55555d"/>
      </linearGradient>
      <linearGradient id="alus-${id}" x1="0" x2="1">
        <stop offset="0" stop-color="#6c6c75"/><stop offset=".5" stop-color="#b9b9c2"/><stop offset="1" stop-color="#4a4a52"/>
      </linearGradient>
      <radialGradient id="glow-${id}" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#e9b893" stop-opacity=".35"/><stop offset="1" stop-color="#e9b893" stop-opacity="0"/>
      </radialGradient>
    </defs>`;

  const fitting = (id, cx, top, h = 46, w = 22) => `
    <rect x="${cx - w / 2 - 6}" y="${top + h - 14}" width="${w + 12}" height="14" rx="3" fill="url(#brass-${id})"/>
    <path d="M${cx - w / 2 - 6} ${top + h - 14}h${w + 12}l-3 -5h${-(w + 6)}z" fill="#f3d3b6" opacity=".55"/>
    <rect x="${cx - w / 2}" y="${top}" width="${w}" height="${h - 14}" rx="2" fill="url(#metal-${id})"/>
    ${Array.from({ length: 6 }, (_, i) => `<line x1="${cx - w / 2}" x2="${cx + w / 2}" y1="${top + 4 + i * 5}" y2="${top + 6 + i * 5}" stroke="#2a2a30" stroke-opacity=".45" stroke-width="1"/>`).join("")}
    <ellipse cx="${cx}" cy="${top}" rx="${w / 2}" ry="3.5" fill="#c9c9cf"/>
    <ellipse cx="${cx}" cy="${top}" rx="${w / 4}" ry="1.8" fill="#1a1a1e"/>`;

  const shapes = {
    flat: (id, p) => `
      ${fitting(id, 100, 44)}
      <path d="M70 92 C70 84 130 84 130 92 L134 112 C134 116 66 116 66 112Z" fill="url(#rub-${id})"/>
      <path d="M42 124 C46 104 154 104 158 124 C158 136 42 136 42 124Z" fill="url(#rub-${id})"/>
      <ellipse cx="100" cy="124" rx="58" ry="13" fill="url(#rubtop-${id})" opacity=".35"/>
      <path d="M48 120 C70 110 130 110 152 120" stroke="#fff" stroke-opacity=".18" stroke-width="1.5" fill="none"/>`,

    bellows: (id, p) => {
      const folds = p.folds || 3;
      let out = fitting(id, 100, 30, 40);
      let y = 70;
      for (let i = 0; i < folds; i++) {
        const w = 34 + i * 4;
        out += `<path d="M${100 - w * 0.7} ${y} C${100 - w} ${y + 8} ${100 - w} ${y + 16} ${100 - w * 0.7} ${y + 20} L${100 + w * 0.7} ${y + 20} C${100 + w} ${y + 16} ${100 + w} ${y + 8} ${100 + w * 0.7} ${y}Z" fill="url(#rub-${id})"/>
                <path d="M${100 - w * 0.95} ${y + 10} C${100 - w * 0.4} ${y + 6} ${100 + w * 0.4} ${y + 6} ${100 + w * 0.95} ${y + 10}" stroke="#fff" stroke-opacity=".16" stroke-width="1.5" fill="none"/>`;
        y += 18;
      }
      out += `<path d="M44 ${y + 14} C48 ${y - 4} 152 ${y - 4} 156 ${y + 14} C156 ${y + 26} 44 ${y + 26} 44 ${y + 14}Z" fill="url(#rub-${id})"/>
              <ellipse cx="100" cy="${y + 14}" rx="56" ry="11" fill="url(#rubtop-${id})" opacity=".3"/>`;
      return out;
    },

    foam: (id, p) => `
      ${fitting(id, 100, 34, 44, 26)}
      <rect x="54" y="78" width="92" height="22" rx="6" fill="url(#alus-${id})"/>
      <path d="M40 104 C40 96 160 96 160 104 L160 126 C160 138 40 138 40 126Z" fill="url(#rub-${id})"/>
      <path d="M36 128 C36 118 164 118 164 128 L164 138 C164 152 36 152 36 138Z" fill="#c9c4ba"/>
      <path d="M36 128 C36 118 164 118 164 128" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" fill="none"/>
      ${Array.from({ length: 34 }, (_, i) => `<circle cx="${40 + ((i * 37) % 122)}" cy="${131 + ((i * 13) % 14)}" r="${0.8 + (i % 3) * 0.5}" fill="#8f897f" opacity=".7"/>`).join("")}`,

    oval: (id, p) => `
      ${fitting(id, 100, 46, 40, 18)}
      <rect x="66" y="84" width="68" height="16" rx="6" fill="url(#rub-${id})"/>
      <path d="M22 118 C26 98 174 98 178 118 C178 130 22 130 22 118Z" fill="url(#rub-${id})"/>
      <ellipse cx="100" cy="117" rx="76" ry="9" fill="url(#rubtop-${id})" opacity=".3"/>
      <path d="M40 112 L160 112" stroke="#fff" stroke-opacity=".14" stroke-width="1.5"/>`,

    wafer: (id, p) => `
      ${fitting(id, 100, 56, 40, 16)}
      <rect x="58" y="94" width="84" height="10" rx="3" fill="url(#alus-${id})"/>
      <path d="M40 116 C44 104 156 104 160 116 C160 124 40 124 40 116Z" fill="url(#rub-${id})"/>
      <ellipse cx="100" cy="113" rx="54" ry="7" fill="url(#rubtop-${id})" opacity=".5"/>
      ${[-30, -15, 0, 15, 30].map((dx) => `<line x1="${100 + dx}" y1="108" x2="${100 + dx * 1.2}" y2="118" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>`).join("")}
      <rect x="30" y="134" width="140" height="6" rx="1.5" fill="#1f3551" opacity=".9"/>
      ${Array.from({ length: 6 }, (_, i) => `<line x1="${38 + i * 25}" y1="134" x2="${38 + i * 25}" y2="140" stroke="#9fb6d6" stroke-opacity=".5" stroke-width=".8"/>`).join("")}`,

    bottle: (id, p) => `
      <rect x="80" y="22" width="40" height="18" rx="3" fill="url(#brass-${id})"/>
      <rect x="64" y="40" width="72" height="36" rx="8" fill="url(#alu-${id})"/>
      <circle cx="136" cy="58" r="6" fill="url(#brass-${id})"/>
      ${Array.from({ length: 5 }, (_, i) => `<path d="M60 ${80 + i * 11} C60 ${86 + i * 11} 140 ${86 + i * 11} 140 ${80 + i * 11} L138 ${88 + i * 11} C138 ${92 + i * 11} 62 ${92 + i * 11} 62 ${88 + i * 11}Z" fill="url(#rub-${id})"/>`).join("")}
      <path d="M82 136 L82 176 C82 186 118 186 118 176 L118 136Z" fill="#9fd1c4" opacity=".28"/>
      <path d="M88 136 L88 172" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`,

    generator: (id, p) => `
      <path d="M34 72 L150 72 L170 58 L54 58Z" fill="#d8d8de"/>
      <path d="M150 72 L170 58 L170 128 L150 142Z" fill="#6a6a73"/>
      <rect x="34" y="72" width="116" height="70" rx="3" fill="url(#alu-${id})"/>
      <rect x="44" y="84" width="60" height="6" rx="3" fill="#c8875a"/>
      <text x="44" y="112" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#2a2a30" letter-spacing="2">EVERSON</text>
      <text x="44" y="126" font-family="Inter, sans-serif" font-size="8" fill="#3c3c44" letter-spacing="1.5">VG 15 · MULTISTAGE</text>
      <circle cx="132" cy="96" r="8" fill="url(#brass-${id})"/><circle cx="132" cy="96" r="3.5" fill="#1a1a1e"/>
      <circle cx="132" cy="122" r="8" fill="url(#brass-${id})"/><circle cx="132" cy="122" r="3.5" fill="#1a1a1e"/>
      <rect x="10" y="98" width="26" height="18" rx="3" fill="url(#metal-${id})"/>
      <path d="M160 70 l0 -2" stroke="#fff"/>
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${156}" y="${80 + i * 10}" width="10" height="3" rx="1.5" fill="#2a2a30" opacity=".7" transform="skewY(-35)"/>`).join("")}`,

    block: (id, p) => `
      <path d="M26 80 L154 80 L176 64 L48 64Z" fill="#cfcfd6"/>
      <path d="M154 80 L176 64 L176 118 L154 134Z" fill="#5e5e67"/>
      <rect x="26" y="80" width="128" height="54" rx="3" fill="url(#alu-${id})"/>
      ${[0, 1, 2, 3].map((i) => `
        <rect x="${36 + i * 30}" y="${40 - (i % 2) * 2}" width="18" height="30" rx="3" fill="#232328"/>
        <rect x="${36 + i * 30}" y="${36 - (i % 2) * 2}" width="18" height="8" rx="2" fill="url(#brass-${id})"/>
        <circle cx="${45 + i * 30}" cy="${112}" r="7" fill="url(#brass-${id})"/>
        <circle cx="${45 + i * 30}" cy="${112}" r="3" fill="#141417"/>
        <circle cx="${45 + i * 30}" cy="${92}" r="2.5" fill="${i === 1 ? "#6ee7a8" : "#c8875a"}"/>`).join("")}
      <rect x="26" y="134" width="128" height="6" fill="#3a3a41"/>`,

    hose: (id, p) => {
      let out = "";
      for (let i = 0; i < 6; i++) {
        const ry = 20 - i * 0.4;
        out += `<ellipse cx="100" cy="${76 + i * 11}" rx="${62 - i * 1.2}" ry="${ry}" fill="none" stroke="#0e5e8f" stroke-width="10" opacity=".95"/>
                <ellipse cx="100" cy="${74 + i * 11}" rx="${62 - i * 1.2}" ry="${ry}" fill="none" stroke="#7cc3ee" stroke-width="2" stroke-opacity=".55"/>`;
      }
      out += `<path d="M160 136 C176 140 180 158 168 170" fill="none" stroke="#0e5e8f" stroke-width="10" stroke-linecap="round"/>
              <path d="M160 134 C174 138 178 154 168 166" fill="none" stroke="#7cc3ee" stroke-width="2" stroke-opacity=".55"/>`;
      return out;
    },

    mat: (id, p) => {
      let holes = "";
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 10; c++) {
          const t = r / 5;
          const x = 44 + c * (11 + t * 1.6) - t * 12;
          const y = 88 + r * 10 + t * 4;
          holes += `<ellipse cx="${x}" cy="${y}" rx="${1.6 + t * 0.6}" ry="${1 + t * 0.4}" fill="#0b0b0d"/>`;
        }
      }
      return `
        <path d="M44 78 L160 78 L182 150 L22 150Z" fill="#26262b"/>
        <path d="M22 150 L182 150 L182 158 L22 158Z" fill="#141417"/>
        <path d="M44 78 L160 78" stroke="#fff" stroke-opacity=".2" stroke-width="1.5"/>
        ${holes}
        <path d="M20 170 L184 170" stroke="url(#brass-${id})" stroke-width="2"/>`;
    },
  };

  return (product, { hero = false } = {}) => {
    const id = `v${++uid}`;
    const draw = shapes[product.shape] || shapes.flat;
    const photo = product.image || (EVERSON.photoManifest || {})[product.id];
    const svg = (hidden) => `<svg viewBox="0 0 200 200" class="h-full w-full drop-shadow-[0_30px_35px_rgba(0,0,0,.65)]"${hidden ? ' style="display:none"' : ""} role="img" aria-label="Makieta produktu ${product.name}">
      ${defs(id, product.rubber || "#1f1f24")}
      ${hero ? `<circle cx="100" cy="100" r="96" fill="url(#glow-${id})"/>` : ""}
      ${draw(id, product)}
    </svg>`;
    if (photo) {
      // Zdjęcie z manifestu; gdy pliku brakuje, wraca makieta wektorowa.
      const src = photo.includes("/") ? photo : `assets/img/products/${photo}`;
      return `<img src="${src}" alt="${product.name} — zdjęcie produktowe" loading="lazy" decoding="async" class="product-photo h-full w-full object-contain"
        onerror="this.nextElementSibling.style.display='';this.remove()">${svg(true)}`;
    }
    return svg(false);
  };
})();
