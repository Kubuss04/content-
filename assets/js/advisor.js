/* ==========================================================================
   Everson AI Advisor — symulacja doradcy technicznego (bez backendu)
   --------------------------------------------------------------------------
   • Prowadzi krótki wywiad: zastosowanie → materiał → powierzchnia →
     warunki pracy → skala/budżet, a następnie punktuje katalog i pokazuje
     rekomendacje jako klikalne karty w rozmowie.
   • Rozumie też swobodny tekst (słowa kluczowe PL) i odpowiada na pytania
     o dostawę, ceny, gwarancję, kontakt i konkretne produkty.
   • Ten sam silnik działa w pływającym widgecie i w sekcji #doradca.
   Aby podłączyć prawdziwy model językowy, podmień metodę `reply()` na
   wywołanie własnego endpointu — interfejs UI pozostaje bez zmian.
   ========================================================================== */
(() => {
  "use strict";

  const { products, industries, formatPrice, renderVisual, getProduct, starsSvg } = EVERSON;
  const { openQuickView, addToCart, escapeHtml } = EVERSON.ui;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

  /* ---------------- Kroki wywiadu ---------------- */
  const STEPS = {
    material: {
      q: "Świetnie. Co będziemy chwytać? Wybierz materiał lub opisz go własnymi słowami.",
      options: [
        { label: "Kartony i opakowania", set: { industry: "opakowania" } },
        { label: "Butelki i puszki", set: { industry: "opakowania", bottle: true } },
        { label: "Szkło i kamień", set: { industry: "szklo" } },
        { label: "Drewno i płyty", set: { industry: "drewno" } },
        { label: "Blachy i metal", set: { industry: "metal" } },
        { label: "Elektronika / PCB", set: { industry: "elektronika" } },
        { label: "Ogniwa PV / wafle", set: { industry: "fotowoltaika" } },
        { label: "Żywność", set: { industry: "spozywczy", condition: "zywnosc" } },
        { label: "Folie i kompozyty", set: { industry: "kompozyty" } },
      ],
    },
    surface: {
      q: "Jaka jest powierzchnia detalu w miejscu chwytu?",
      options: [
        { label: "Gładka i płaska", set: { surface: "gladka" } },
        { label: "Strukturalna / porowata", set: { surface: "strukturalna" } },
        { label: "Nierówna lub zakrzywiona", set: { surface: "nierowna" } },
        { label: "Delikatna / cienka", set: { surface: "delikatna" } },
      ],
    },
    condition: {
      q: "W jakich warunkach pracuje chwytak?",
      options: [
        { label: "Standardowe warunki hali", set: { condition: "standard" } },
        { label: "Wysoka temperatura (>100 °C)", set: { condition: "temperatura" } },
        { label: "Kontakt z żywnością", set: { condition: "zywnosc" } },
        { label: "Bez śladów / czyste środowisko", set: { condition: "czystosc" } },
      ],
    },
    tier: {
      q: "Ostatnie pytanie — jaka jest skala i budżet?",
      options: [
        { label: "Pojedyncze wymiany · ekonomicznie", set: { tier: 1 } },
        { label: "Seria na linię · optymalnie", set: { tier: 2 } },
        { label: "Kompletny układ · premium", set: { tier: 3 } },
      ],
    },
  };
  const ORDER = ["material", "surface", "condition", "tier"];

  /* ---------------- Słownik słów kluczowych (NLU-lite) ---------------- */
  const KEYWORDS = [
    { re: /butel|puszk|pet\b|szyjk/, set: { industry: "opakowania", bottle: true } },
    { re: /karton|pudel|opakow|paletyz|worek|work/, set: { industry: "opakowania" } },
    { re: /szkl|szyb(?!k)|kamien|granit|marmur|kafl|plytk/, set: { industry: "szklo" } },
    { re: /drewn|mebl|mdf|plyt[ay]\b|sklejk|fornir/, set: { industry: "drewno" } },
    { re: /blach|metal|stal|alumin/, set: { industry: "metal" } },
    { re: /elektron|pcb|plytk[ai] drukow|smd/, set: { industry: "elektronika" } },
    { re: /\bpv\b|fotowolt|ogniw|wafl|krzem/, set: { industry: "fotowoltaika" } },
    { re: /zywnos|spozyw|cukier|slodycz|piecz|mies|\bser\b|czekolad/, set: { industry: "spozywczy", condition: "zywnosc" } },
    { re: /kompozyt|foli|tworzyw|plastik|karbon/, set: { industry: "kompozyty" } },
    { re: /samoch|motoryz|karoser|automotive/, set: { industry: "motoryzacja" } },
    { re: /glad|plask|polerow/, set: { surface: "gladka" } },
    { re: /struktur|poro|ryflow|chropow|szorstk|rowk/, set: { surface: "strukturalna" } },
    { re: /nierown|zakrzyw|krzyw|wypukl|faluj|pochyl/, set: { surface: "nierowna" } },
    { re: /delikat|ciensk|cienk|kruch|pekn/, set: { surface: "delikatna" } },
    { re: /temperat|gorac|piec\b|piecow|hartow|\b[1-9]\d{2}\s?°?c/, set: { condition: "temperatura" } },
    { re: /slad|czyst|clean|\besd\b/, set: { condition: "czystosc" } },
    { re: /tani|ekonom|budzet|najtan|wymian/, set: { tier: 1 } },
    { re: /seri|lini[ai]/, set: { tier: 2 } },
    { re: /system|kompletn|uklad|premium|nowa linia|od zera/, set: { tier: 3 } },
  ];

  const FAQ = [
    { re: /dostaw|wysyl|kurier|kiedy dotrze|czas realiz/, a: "Produkty dostępne od ręki wysyłamy z magazynu w Toruniu w ciągu 24 h. Od 500 zł netto dostawa jest bezpłatna. Dla pozycji na zamówienie opiekun potwierdzi termin w dniu złożenia zamówienia." },
    { re: /rabat|znizk|cennik|hurt|kontrakt|bon|kod/, a: "Dla stałych klientów przygotowujemy indywidualne cenniki kontraktowe, a na start możesz odebrać bon <strong>-10%</strong> zapisując się do Klubu Everson w stopce strony. Przy większych wolumenach poproś o wycenę — odpowiadamy zwykle tego samego dnia." },
    { re: /gwaranc|zwrot|reklamac|satysfakc/, a: "Sprzedajemy wyłącznie oryginalne komponenty. Jeśli dobrany produkt nie sprawdzi się w Twojej aplikacji, pomożemy dobrać zamiennik — szczegóły zwrotów i reklamacji znajdziesz w stopce strony." },
    { re: /kontakt|telefon|zadzwon|mail|inzynier|konsultant|czlowiek|handlow/, a: "Chętnie połączę Cię z zespołem aplikacyjnym:<br>📞 <a class=\"text-copper-300 underline\" href=\"tel:+48566566171\">+48 56 656 61 71</a><br>✉️ <a class=\"text-copper-300 underline\" href=\"mailto:kontakt@everson.com.pl\">kontakt@everson.com.pl</a><br>Pon.–Pt. 7:00–15:00, ul. Towarowa 5, Toruń." },
    { re: /faktur|vat|nip|przelew|platno/, a: "Każde zamówienie dokumentujemy fakturą VAT. Obsługujemy przelew tradycyjny, szybkie płatności online, a dla stałych klientów — odroczony termin płatności." },
    { re: /generator|ejektor|pomp/, a: "Generator podciśnienia (ejektor) wytwarza próżnię ze sprężonego powietrza — bez części ruchomych i bez serwisu. Wersje wielostopniowe, jak EV-Gen VG 15, szybciej zasysają i zużywają mniej powietrza.", show: ["ev-gen-vg15"] },
    { re: /mieszk|falda|fald/, a: "Przyssawki mieszkowe kompensują różnice wysokości i nachylenia, a przy zasysaniu lekko unoszą detal. To najlepszy wybór do opakowań i powierzchni nierównych.", show: ["ev-bellow-25", "ev-food-30"] },
    { re: /\bwaz|przewod/, a: "Do instalacji próżniowych polecamy węże poliuretanowe odporne na zapadanie się przy głębokim podciśnieniu.", show: ["ev-hose-pu86"] },
    { re: /\bmat[ay]?\b|stol/, a: "Maty ssące mocują arkusze na całej płaszczyźnie — bez zacisków i bez śladów. Można je przyciąć do formatu stołu.", show: ["ev-mat-sm600"] },
  ];

  const LABELS = {
    industry: (v) => industries[v],
    surface: (v) => ({ gladka: "powierzchnia gładka", strukturalna: "powierzchnia strukturalna", nierowna: "powierzchnia nierówna", delikatna: "detal delikatny" }[v]),
    condition: (v) => ({ standard: "warunki standardowe", temperatura: "wysoka temperatura", zywnosc: "kontakt z żywnością", czystosc: "bez śladów" }[v]),
    tier: (v) => ({ 1: "budżet ekonomiczny", 2: "seria na linię", 3: "kompletny układ" }[v]),
  };

  /* ---------------- Rekomendacje ---------------- */
  const recommend = (profile) => {
    const pool = products.filter((p) => p.surfaces.length || (profile.bottle && p.category === "chwytaki"));
    const scored = pool.map((p) => {
      let s = 0;
      if (profile.industry && p.industries.includes(profile.industry)) s += 3;
      if (profile.surface && p.surfaces.includes(profile.surface)) s += 3;
      if (profile.condition && profile.condition !== "standard") s += p.conditions.includes(profile.condition) ? 5 : -4;
      if (profile.tier) s += 1.5 - Math.abs(p.tier - profile.tier) * 0.75;
      if (profile.bottle) s += p.category === "chwytaki" ? 8 : -1;
      else if (p.category === "chwytaki") s -= 6;
      s += (p.rating - 4.5) + (p.bestseller ? 0.4 : 0);
      return { p, s };
    });
    return scored.sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.p);
  };

  const STRICT = { temperatura: "wysokiej temperatury", zywnosc: "kontaktu z żywnością", czystosc: "stref wymagających braku śladów" };
  const SURFACE_FOR = { gladka: "gładkie powierzchnie", strukturalna: "powierzchnie strukturalne", nierowna: "nierówne powierzchnie", delikatna: "delikatne detale" };

  const whyLine = (p, profile) => {
    const r = [];
    if (STRICT[profile.condition] && !p.conditions.includes(profile.condition)) r.push(`alternatywa poza strefą ${STRICT[profile.condition]}`);
    if (profile.condition === "temperatura" && p.conditions.includes("temperatura")) r.push(`pracuje do +${p.temp[1]} °C`);
    if (profile.condition === "zywnosc" && p.conditions.includes("zywnosc")) r.push("materiał do kontaktu z żywnością");
    if (profile.condition === "czystosc" && p.conditions.includes("czystosc")) r.push("nie zostawia śladów");
    if (profile.surface && p.surfaces.includes(profile.surface)) r.push(`zaprojektowana na ${SURFACE_FOR[profile.surface]}`);
    if (profile.industry && p.industries.includes(profile.industry)) r.push(`sprawdzona w branży: ${industries[profile.industry].toLowerCase()}`);
    return r.length ? r.slice(0, 2).join(" · ") : p.benefit;
  };

  /* ==========================================================================
     Klasa widoku czatu
     ========================================================================== */
  class AdvisorChat {
    constructor(root, { floating = false } = {}) {
      this.root = root;
      this.floating = floating;
      this.profile = {};
      this.busy = false;
      this.build();
      this.greet();
    }

    build() {
      const uid = this.floating ? "f" : "i";
      this.root.innerHTML = `
        <div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span class="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-copper-300 via-copper-500 to-copper-700 text-ink-950">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" stroke-linejoin="round"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" stroke-linejoin="round"/></svg>
            <span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-900 bg-emerald-400"></span>
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-serif text-lg leading-tight text-bone-50">Everson AI Advisor</p>
            <p class="text-xs text-bone-400">Doradca techniczny · online</p>
          </div>
          <button type="button" data-act="reset" class="grid h-9 w-9 place-items-center rounded-full text-bone-400 hover:bg-white/5 hover:text-bone-50" aria-label="Zacznij rozmowę od nowa" title="Zacznij od nowa">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          ${this.floating ? `<button type="button" data-act="close" class="grid h-9 w-9 place-items-center rounded-full text-bone-400 hover:bg-white/5 hover:text-bone-50" aria-label="Zamknij doradcę">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/></svg></button>` : ""}
        </div>
        <div class="chat-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" data-el="log" role="log" aria-live="polite" aria-label="Rozmowa z doradcą"></div>
        <div data-el="quick" class="flex flex-wrap gap-2 px-4 pb-3 sm:px-5"></div>
        <form data-el="form" class="flex items-center gap-2 border-t border-white/10 p-3">
          <label for="advisor-input-${uid}" class="sr-only">Napisz wiadomość do doradcy</label>
          <input id="advisor-input-${uid}" data-el="input" type="text" autocomplete="off" maxlength="400" placeholder="Opisz aplikację, np. „szkło, 200 °C”…"
                 class="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-bone-50 placeholder:text-bone-400 focus:border-copper-400/60 focus:outline-none">
          <button type="submit" class="btn-copper grid h-11 w-11 shrink-0 place-items-center rounded-full" aria-label="Wyślij">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </form>`;
      this.log = this.root.querySelector('[data-el="log"]');
      this.quick = this.root.querySelector('[data-el="quick"]');
      this.input = this.root.querySelector('[data-el="input"]');

      this.root.querySelector('[data-el="form"]').addEventListener("submit", (e) => {
        e.preventDefault();
        const text = this.input.value.trim();
        if (!text || this.busy) return;
        this.input.value = "";
        this.handleText(text);
      });
      this.root.addEventListener("click", (e) => {
        const act = e.target.closest("[data-act]");
        if (act?.dataset.act === "reset") this.reset();
        if (act?.dataset.act === "close") EVERSON.advisor.close();
        const opt = e.target.closest("[data-opt]");
        if (opt && !this.busy) this.handleOption(JSON.parse(opt.dataset.opt), opt.textContent.trim());
        const card = e.target.closest("[data-rec]");
        if (card) {
          if (e.target.closest("[data-rec-add]")) addToCart(card.dataset.rec);
          else openQuickView(card.dataset.rec);
        }
      });
    }

    /* ---------- Render wiadomości ---------- */
    scroll() { this.log.scrollTo({ top: this.log.scrollHeight, behavior: reducedMotion ? "auto" : "smooth" }); }

    addUser(text) {
      this.log.insertAdjacentHTML("beforeend", `
        <div class="msg-in flex justify-end">
          <p class="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-copper-300 to-copper-500 px-4 py-2.5 text-sm text-ink-950">${escapeHtml(text)}</p>
        </div>`);
      this.scroll();
    }

    addBot(html, extra = "") {
      this.log.insertAdjacentHTML("beforeend", `
        <div class="msg-in flex gap-2.5">
          <span class="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-copper-300/30 bg-copper-500/10 text-copper-300" aria-hidden="true">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" stroke-linejoin="round"/></svg>
          </span>
          <div class="min-w-0 max-w-[88%] space-y-3">
            <div class="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-relaxed text-bone-100">${html}</div>
            ${extra}
          </div>
        </div>`);
      this.scroll();
    }

    cards(list, profile = {}) {
      return `<div class="grid gap-2">${list.map((p) => `
        <div data-rec="${p.id}" role="button" tabindex="0" aria-label="Szybki podgląd: ${escapeHtml(p.name)}"
             class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-ink-950/50 p-2.5 transition hover:border-copper-300/40 hover:bg-white/[0.04]">
          <span class="studio relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl"><span class="absolute inset-1.5 block transition duration-500 group-hover:scale-110">${renderVisual(p)}</span></span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-serif text-[15px] text-bone-50">${escapeHtml(p.name)}</span>
            <span class="mt-0.5 flex items-center gap-1.5 text-[11px] text-bone-400">${starsSvg(p.rating, 10)} ${p.rating.toFixed(1).replace(".", ",")}</span>
            <span class="mt-1 block text-[11px] leading-snug text-bone-300">${escapeHtml(whyLine(p, profile))}</span>
          </span>
          <span class="flex shrink-0 flex-col items-end gap-1.5">
            <span class="text-xs font-medium text-bone-50">${formatPrice(p.price)}</span>
            <button type="button" data-rec-add class="grid h-8 w-8 place-items-center rounded-full bg-copper-400 text-ink-950 transition hover:bg-copper-300" aria-label="Dodaj ${escapeHtml(p.name)} do koszyka">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
            </button>
          </span>
        </div>`).join("")}</div>`;
    }

    setQuick(options = []) {
      this.quick.innerHTML = options
        .map((o) => `<button type="button" data-opt='${escapeHtml(JSON.stringify(o.set || { action: o.action }))}'
                  class="rounded-full border border-copper-300/30 bg-copper-500/10 px-3.5 py-2 text-xs text-copper-200 transition hover:border-copper-300/60 hover:bg-copper-500/20">${o.label}</button>`)
        .join("");
    }

    typing(ms = 700) {
      this.busy = true;
      this.setQuick([]);
      const el = document.createElement("div");
      el.className = "msg-in flex gap-2.5";
      el.innerHTML = `<span class="w-7 shrink-0"></span><div class="typing flex items-center gap-1 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.05] px-4 py-3.5" aria-label="Doradca pisze"><span></span><span></span><span></span></div>`;
      this.log.appendChild(el);
      this.scroll();
      return new Promise((res) => setTimeout(() => { el.remove(); this.busy = false; res(); }, reducedMotion ? 150 : ms));
    }

    /* ---------- Logika rozmowy ---------- */
    async greet() {
      this.log.innerHTML = "";
      this.profile = {};
      this.addBot(
        "Cześć! Jestem Twoim osobistym doradcą Everson. 👋<br>Szukasz rozwiązania do <strong>konkretnej, wymagającej aplikacji</strong> czy kompletujesz części do <strong>codziennego utrzymania ruchu</strong>?"
      );
      this.setQuick([
        { label: "Nowa, wymagająca aplikacja", action: "start" },
        { label: "Codzienne utrzymanie ruchu", action: "start-maint" },
        { label: "Bestsellery", action: "bestsellers" },
        { label: "Rozmowa z inżynierem", action: "human" },
      ]);
    }

    reset() { this.greet(); }

    nextStep() { return ORDER.find((k) => this.profile[k === "material" ? "industry" : k] === undefined); }

    async ask(step) {
      await this.typing(550);
      const s = STEPS[step];
      const progress = ORDER.indexOf(step) + 1;
      this.addBot(`<span class="mb-1 block text-[10px] uppercase tracking-[0.2em] text-copper-300">Krok ${progress} z ${ORDER.length}</span>${s.q}`);
      this.setQuick(s.options);
    }

    async advance() {
      const step = this.nextStep();
      if (step) return this.ask(step);
      return this.showRecommendations();
    }

    async showRecommendations() {
      await this.typing(1100);
      const recs = recommend(this.profile);
      const summary = Object.entries(this.profile)
        .filter(([k]) => LABELS[k])
        .map(([k, v]) => `<span class="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-bone-200">${LABELS[k](v)}</span>`)
        .join(" ");
      this.addBot(
        `Przeanalizowałem parametry:<div class="my-2 flex flex-wrap gap-1">${summary}</div>Oto komponenty, które polecam dla tej aplikacji. Kliknij kartę, aby zobaczyć pełną specyfikację.`,
        this.cards(recs, this.profile)
      );
      const opts = [];
      if (this.profile.tier === 3 || this.profile.tier === 2) opts.push({ label: "Dobierz generator i akcesoria", action: "system" });
      opts.push({ label: "Zacznij od nowa", action: "restart" }, { label: "Rozmowa z inżynierem", action: "human" });
      this.setQuick(opts);
    }

    async handleOption(set, label) {
      this.addUser(label);
      if (set.action) return this.runAction(set.action);
      Object.assign(this.profile, set);
      return this.advance();
    }

    async runAction(action) {
      switch (action) {
        case "start":
          return this.ask("material");
        case "start-maint":
          await this.typing(600);
          this.addBot("Rozumiem — liczy się niezawodność i szybka dostępność. Wszystkie bestsellery wysyłamy w 24 h. Podaj proszę kilka szczegółów, a dobiorę dokładny odpowiednik.");
          this.profile.tier = 1;
          return this.ask("material");
        case "bestsellers": {
          await this.typing(700);
          const list = products.filter((p) => p.bestseller).slice(0, 3);
          this.addBot("Oto produkty, które klienci wybierają najczęściej — sprawdzone na tysiącach linii:", this.cards(list));
          return this.setQuick([{ label: "Dobierz dla mojej aplikacji", action: "start" }, { label: "Rozmowa z inżynierem", action: "human" }]);
        }
        case "system": {
          await this.typing(800);
          const list = ["ev-gen-vg15", "ev-block-vb4", "ev-hose-pu86"].map(getProduct);
          this.addBot("Aby przyssawki pracowały z pełną wydajnością, warto skompletować cały obwód próżni. Polecam taki zestaw:", this.cards(list));
          return this.setQuick([{ label: "Zacznij od nowa", action: "restart" }, { label: "Rozmowa z inżynierem", action: "human" }]);
        }
        case "human":
          await this.typing(600);
          this.addBot(FAQ.find((f) => /kontakt/.test(f.re.source)).a + "<br><br>Możesz też opisać aplikację tutaj — przekażę podsumowanie inżynierowi.");
          return this.setQuick([{ label: "Kontynuuj z doradcą AI", action: "start" }]);
        case "restart":
          return this.greet();
      }
    }

    async handleText(text) {
      this.addUser(text);
      const t = norm(text);

      // 1) Konkretny produkt z katalogu
      const named = products.find((p) => t.includes(norm(p.name)) || t.includes(norm(p.name.split(" ")[0])));

      // 2) Parametry aplikacji
      const found = {};
      KEYWORDS.forEach((k) => { if (k.re.test(t)) Object.entries(k.set).forEach(([kk, v]) => { if (found[kk] === undefined) found[kk] = v; }); });

      // 3) Pytania ogólne
      const faq = FAQ.find((f) => f.re.test(t));

      if (named && /sprawdzi|pasuje|nada|czy /.test(t)) {
        await this.typing(800);
        this.addBot(`<strong>${escapeHtml(named.name)}</strong> — ${escapeHtml(named.benefit)}<br><br>Aby potwierdzić dopasowanie, odpowiedz na kilka pytań o Twoją aplikację.`, this.cards([named]));
        Object.assign(this.profile, found);
        return this.advance();
      }

      if (faq) {
        await this.typing(750);
        this.addBot(faq.a, faq.show ? this.cards(faq.show.map(getProduct)) : "");
        if (Object.keys(found).length) { Object.assign(this.profile, found); return this.advance(); }
        return this.setQuick([{ label: "Dobierz produkt", action: "start" }, { label: "Bestsellery", action: "bestsellers" }]);
      }

      if (Object.keys(found).length) {
        Object.assign(this.profile, found);
        const understood = Object.entries(found).filter(([k]) => LABELS[k]).map(([k, v]) => LABELS[k](v)).join(", ");
        await this.typing(600);
        this.addBot(`Zanotowałem: <em class="text-copper-200">${understood}</em>.`);
        return this.advance();
      }

      if (named) {
        await this.typing(700);
        this.addBot(`${escapeHtml(named.headline)} ${escapeHtml(named.benefit)}`, this.cards([named]));
        return this.setQuick([{ label: "Dobierz dla mojej aplikacji", action: "start" }]);
      }

      if (/^(hej|czesc|dzien dobry|witam|siema|hello)/.test(t)) {
        await this.typing(500);
        this.addBot("Dzień dobry! Opisz, co chcesz chwytać i w jakich warunkach — albo wybierz jedną z opcji poniżej.");
        return this.setQuick([{ label: "Dobierz produkt", action: "start" }, { label: "Bestsellery", action: "bestsellers" }]);
      }

      if (/dziek|super|ok\b|swietnie/.test(t)) {
        await this.typing(500);
        this.addBot("Cała przyjemność po mojej stronie. Jeśli będziesz potrzebować wyceny dla większej ilości, nasz zespół przygotuje ją jeszcze dziś.");
        return this.setQuick([{ label: "Zacznij od nowa", action: "restart" }, { label: "Rozmowa z inżynierem", action: "human" }]);
      }

      await this.typing(700);
      this.addBot("Chcę dobrać to precyzyjnie. Napisz proszę, <strong>jaki materiał</strong> chwytamy i <strong>w jakich warunkach</strong> (np. „kartony, linia pakująca” albo „szkło, 200 °C”). Możesz też wybrać opcję poniżej.");
      this.setQuick([{ label: "Poprowadź mnie krok po kroku", action: "start" }, { label: "Rozmowa z inżynierem", action: "human" }]);
    }

    send(text) { if (text) this.handleText(text); }
  }

  /* ==========================================================================
     Inicjalizacja: sekcja + pływający widget
     ========================================================================== */
  const inlineRoot = document.querySelector('[data-advisor-root="inline"]');
  const panel = document.getElementById("advisor-panel");
  const fab = document.getElementById("advisor-fab");
  const inline = inlineRoot ? new AdvisorChat(inlineRoot) : null;
  const floating = new AdvisorChat(panel, { floating: true });

  // Karty rekomendacji dostępne z klawiatury
  document.addEventListener("keydown", (e) => {
    const card = e.target.closest?.("[data-rec]");
    if (card && (e.key === "Enter" || e.key === " ") && !e.target.closest("[data-rec-add]")) {
      e.preventDefault();
      openQuickView(card.dataset.rec);
    }
  });

  const setOpen = (open) => {
    panel.dataset.open = String(open);
    fab.setAttribute("aria-expanded", String(open));
    fab.querySelector(".fab-label").textContent = open ? "Zamknij" : "Doradca AI";
    if (open) setTimeout(() => floating.input.focus({ preventScroll: true }), 250);
  };
  fab.addEventListener("click", () => setOpen(panel.dataset.open !== "true"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.dataset.open === "true") { setOpen(false); fab.focus(); } });

  // Gdy sekcja z osadzonym czatem jest na ekranie, chowamy pływający przycisk,
  // aby nie dublować interfejsu.
  if (inlineRoot && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      const hide = en.isIntersecting && panel.dataset.open !== "true";
      fab.style.opacity = hide ? "0" : "";
      fab.style.pointerEvents = hide ? "none" : "";
      fab.tabIndex = hide ? -1 : 0;
    }, { threshold: 0.35 }).observe(inlineRoot);
  }

  EVERSON.advisor = {
    open(prefill) {
      setOpen(true);
      if (prefill) floating.send(prefill);
    },
    close() { setOpen(false); fab.focus(); },
    inline,
    floating,
  };
})();
