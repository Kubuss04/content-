/* ==========================================================================
   Everson AI Advisor — symulacja doradcy technicznego (bez backendu)
   --------------------------------------------------------------------------
   • Prowadzi krótki wywiad: materiał → powierzchnia → warunki pracy →
     skala/budżet, a następnie punktuje katalog i pokazuje rekomendacje
     jako klikalne karty w rozmowie.
   • Rozumie swobodny tekst (słowa kluczowe PL / EN / DE) i odpowiada na
     pytania o dostawę, ceny, gwarancję, kontakt i konkretne produkty.
   • Teksty rozmowy: EVERSON.content.advisor (i18n-content.js).
   • Ten sam silnik działa w pływającym widgecie i w sekcji #doradca.
   Aby podłączyć prawdziwy model językowy, w `handleText()` wyślij wiadomość
   i `this.profile` do własnego endpointu — interfejs UI pozostaje bez zmian.
   ========================================================================== */
(() => {
  "use strict";

  const { products, formatPrice, renderVisual, getProduct, starsSvg, pf, indLabel, fmtNum } = EVERSON;
  const { openQuickView, addToCart, escapeHtml } = EVERSON.ui;
  const I18N = EVERSON.i18n;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/ß/g, "ss");
  const C = () => I18N.pick(EVERSON.content.advisor);
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

  /* ---------------- Kroki wywiadu (etykiety w słowniku) ---------------- */
  const STEP_SETS = {
    material: [
      { industry: "opakowania" }, { industry: "opakowania", bottle: true }, { industry: "szklo" }, { industry: "drewno" },
      { industry: "metal" }, { industry: "elektronika" }, { industry: "fotowoltaika" }, { industry: "spozywczy", condition: "zywnosc" },
      { industry: "kompozyty" },
    ],
    surface: [{ surface: "gladka" }, { surface: "strukturalna" }, { surface: "nierowna" }, { surface: "delikatna" }],
    condition: [{ condition: "standard" }, { condition: "temperatura" }, { condition: "zywnosc" }, { condition: "czystosc" }],
    tier: [{ tier: 1 }, { tier: 2 }, { tier: 3 }],
  };
  const ORDER = ["material", "surface", "condition", "tier"];
  const stepOptions = (step) => STEP_SETS[step].map((set, i) => ({ label: C().opt[step][i], set }));
  const act = (key, action) => ({ label: C().a[key], action });

  /* ---------------- Słownik słów kluczowych (PL / EN / DE) ---------------- */
  const KEYWORDS = [
    { re: /butel|puszk|pet\b|szyjk|bottle|\bcans?\b|flasch|dose/, set: { industry: "opakowania", bottle: true } },
    { re: /karton|pudel|opakow|paletyz|worek|work|carton|box|packag|pallet|verpack|schachtel|palett/, set: { industry: "opakowania" } },
    { re: /szkl|szyb(?!k)|kamien|granit|marmur|kafl|plytk|glass|stone|tile|\bglas\b|stein|fliese/, set: { industry: "szklo" } },
    { re: /drewn|mebl|mdf|plyt[ay]\b|sklejk|fornir|wood|timber|furniture|plywood|\bholz|mobel|sperrholz/, set: { industry: "drewno" } },
    { re: /blach|metal|stal|alumin|sheet metal|steel|\bblech|stahl/, set: { industry: "metal" } },
    { re: /elektron|pcb|plytk[ai] drukow|smd|electronic|circuit board|leiterplatt/, set: { industry: "elektronika" } },
    { re: /\bpv\b|fotowolt|ogniw|wafl|krzem|photovolt|solar|wafer|silicon|silizium|zelle/, set: { industry: "fotowoltaika" } },
    { re: /zywnos|spozyw|cukier|slodycz|piecz|mies|\bser\b|czekolad|food|confection|sweets|bakery|chocolate|lebensmittel|suss|backwar|geback|schokolad/, set: { industry: "spozywczy", condition: "zywnosc" } },
    { re: /kompozyt|foli|tworzyw|plastik|karbon|composite|plastic|film|carbon|verbund|kunststoff|folie/, set: { industry: "kompozyty" } },
    { re: /samoch|motoryz|karoser|automotive|\bcar\b|body panel|\bauto\b|fahrzeug|karosser/, set: { industry: "motoryzacja" } },
    { re: /glad|plask|polerow|smooth|flat|polished|\bglatt|\beben\b|poliert/, set: { surface: "gladka" } },
    { re: /struktur|poro|ryflow|chropow|szorstk|rowk|textur|rough|groov|\brau\b|rille/, set: { surface: "strukturalna" } },
    { re: /nierown|zakrzyw|krzyw|wypukl|faluj|pochyl|uneven|curved|irregular|uneben|gewolbt|gebogen/, set: { surface: "nierowna" } },
    { re: /delikat|ciensk|cienk|kruch|pekn|delicate|thin|fragile|brittle|empfindlich|dunn|zerbrech/, set: { surface: "delikatna" } },
    { re: /temperat|gorac|piec\b|piecow|hartow|\bhot\b|heat|furnace|oven|tempering|heiss|hitze|\bofen|\bhart|\b[1-9]\d{2}\s?°?c/, set: { condition: "temperatura" } },
    { re: /slad|czyst|clean|\besd\b|non.?marking|no marks|spurfrei|sauber|\brein\b/, set: { condition: "czystosc" } },
    { re: /tani|ekonom|budzet|najtan|wymian|cheap|budget|econom|replacement|spare|gunstig|ersatz/, set: { tier: 1 } },
    { re: /seri|lini[ai]|series|production line|\bline\b|linie/, set: { tier: 2 } },
    { re: /system|kompletn|uklad|premium|nowa linia|od zera|complete|new line|komplett|neue linie/, set: { tier: 3 } },
  ];

  const FAQ = [
    { key: "delivery", re: /dostaw|wysyl|kurier|kiedy dotrze|czas realiz|deliver|shipping|ship|dispatch|lieferung|liefer|versand/ },
    { key: "price", re: /rabat|znizk|cennik|hurt|kontrakt|bon|kod|discount|price list|voucher|coupon|rabatt|preisliste|gutschein/ },
    { key: "warranty", re: /gwaranc|zwrot|reklamac|satysfakc|warrant|guarantee|return|complaint|garantie|ruckgabe|reklamation/ },
    { key: "contact", re: /kontakt|telefon|zadzwon|mail|inzynier|konsultant|czlowiek|handlow|contact|phone|\bcall\b|engineer|human|ingenieur|anruf|ansprechpartner/ },
    { key: "invoice", re: /faktur|vat|nip|przelew|platno|invoice|payment|pay\b|rechnung|zahlung|mwst/ },
    { key: "generator", re: /generator|ejektor|ejector|pomp|pump|vakuumerzeuger|erzeuger/, show: ["ev-gen-vg15"] },
    { key: "bellows", re: /mieszk|falda|fald|bellow|faltenbalg/, show: ["ev-bellow-25", "ev-food-30"] },
    { key: "hose", re: /\bwaz|przewod|hose|tubing|schlauch/, show: ["ev-hose-pu86"] },
    { key: "mat", re: /\bmat[ay]?\b|stol|suction mat|saugmatte|\bmatte/, show: ["ev-mat-sm600"] },
  ];

  const label = (k, v) => (k === "industry" ? indLabel(v) : C().labels[k]?.[v]);

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

  const whyLine = (p, profile) => {
    const c = C(), w = c.why, r = [];
    if (c.strict[profile.condition] && !p.conditions.includes(profile.condition)) r.push(fill(w.alt, { what: c.strict[profile.condition] }));
    if (profile.condition === "temperatura" && p.conditions.includes("temperatura")) r.push(fill(w.temp, { t: p.temp[1] }));
    if (profile.condition === "zywnosc" && p.conditions.includes("zywnosc")) r.push(w.food);
    if (profile.condition === "czystosc" && p.conditions.includes("czystosc")) r.push(w.clean);
    if (profile.surface && p.surfaces.includes(profile.surface)) r.push(fill(w.surface, { what: c.surfaceFor[profile.surface] }));
    if (profile.industry && p.industries.includes(profile.industry)) r.push(fill(w.industry, { what: indLabel(profile.industry).toLowerCase() }));
    return r.length ? r.slice(0, 2).join(" · ") : pf(p, "benefit");
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
      this.timers = [];
      this.root.addEventListener("click", (e) => this.onClick(e));
      this.build();
      this.greet();
    }

    build() {
      const c = C();
      const uid = this.floating ? "f" : "i";
      this.root.innerHTML = `
        <div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span class="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-copper-300 via-copper-500 to-copper-700 text-ink-950">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" stroke-linejoin="round"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" stroke-linejoin="round"/></svg>
            <span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-900 bg-emerald-400"></span>
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-serif text-lg leading-tight text-bone-50">${c.title}</p>
            <p class="text-xs text-bone-400">${c.status}</p>
          </div>
          <button type="button" data-act="reset" class="grid h-9 w-9 place-items-center rounded-full text-bone-400 hover:bg-white/5 hover:text-bone-50" aria-label="${c.reset}" title="${c.reset}">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          ${this.floating ? `<button type="button" data-act="close" class="grid h-9 w-9 place-items-center rounded-full text-bone-400 hover:bg-white/5 hover:text-bone-50" aria-label="${c.close}">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/></svg></button>` : ""}
        </div>
        <div class="chat-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" data-el="log" role="log" aria-live="polite" aria-label="${c.log}"></div>
        <div data-el="quick" class="flex flex-wrap gap-2 px-4 pb-3 sm:px-5"></div>
        <form data-el="form" class="flex items-center gap-2 border-t border-white/10 p-3">
          <label for="advisor-input-${uid}" class="sr-only">${c.inputLabel}</label>
          <input id="advisor-input-${uid}" data-el="input" type="text" autocomplete="off" maxlength="400" placeholder="${escapeHtml(c.placeholder)}"
                 class="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-bone-50 placeholder:text-bone-400 focus:border-copper-400/60 focus:outline-none">
          <button type="submit" class="btn-copper grid h-11 w-11 shrink-0 place-items-center rounded-full" aria-label="${c.send}">
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
    }

    onClick(e) {
      const a = e.target.closest("[data-act]");
      if (a?.dataset.act === "reset") this.greet();
      if (a?.dataset.act === "close") EVERSON.advisor.close();
      const opt = e.target.closest("[data-opt]");
      if (opt && !this.busy) this.handleOption(JSON.parse(opt.dataset.opt), opt.textContent.trim());
      const card = e.target.closest("[data-rec]");
      if (card) {
        if (e.target.closest("[data-rec-add]")) addToCart(card.dataset.rec);
        else openQuickView(card.dataset.rec);
      }
    }

    /** Zmiana języka: nowy interfejs i nowa rozmowa w wybranym języku. */
    relocalize() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      this.busy = false;
      this.build();
      this.greet();
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
      const m = C().m;
      return `<div class="grid gap-2">${list.map((p) => `
        <div data-rec="${p.id}" role="button" tabindex="0" aria-label="${escapeHtml(fill(m.card, { name: p.name }))}"
             class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-ink-950/50 p-2.5 transition hover:border-copper-300/40 hover:bg-white/[0.04]">
          <span class="studio relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl"><span class="absolute inset-1.5 block transition duration-500 group-hover:scale-110">${renderVisual(p)}</span></span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-serif text-[15px] text-bone-50">${escapeHtml(p.name)}</span>
            <span class="mt-0.5 flex items-center gap-1.5 text-[11px] text-bone-400">${starsSvg(p.rating, 10)} ${fmtNum(p.rating)}</span>
            <span class="mt-1 block text-[11px] leading-snug text-bone-300">${escapeHtml(whyLine(p, profile))}</span>
          </span>
          <span class="flex shrink-0 flex-col items-end gap-1.5">
            <span class="text-xs font-medium text-bone-50">${formatPrice(p.price)}</span>
            <button type="button" data-rec-add class="grid h-8 w-8 place-items-center rounded-full bg-copper-400 text-ink-950 transition hover:bg-copper-300" aria-label="${escapeHtml(fill(m.add, { name: p.name }))}">
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
      el.innerHTML = `<span class="w-7 shrink-0"></span><div class="typing flex items-center gap-1 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.05] px-4 py-3.5" aria-label="${C().typing}"><span></span><span></span><span></span></div>`;
      this.log.appendChild(el);
      this.scroll();
      const gen = this.log;
      // Jeśli w trakcie „pisania” zmieni się język, stara rozmowa nie jest kontynuowana.
      return new Promise((res) => this.timers.push(setTimeout(() => { el.remove(); this.busy = false; if (gen === this.log) res(); }, reducedMotion ? 150 : ms)));
    }

    /* ---------- Logika rozmowy ---------- */
    greet() {
      this.log.innerHTML = "";
      this.profile = {};
      this.addBot(C().greet);
      this.setQuick([act("start", "start"), act("maint", "start-maint"), act("best", "bestsellers"), act("human", "human")]);
    }

    nextStep() { return ORDER.find((k) => this.profile[k === "material" ? "industry" : k] === undefined); }

    async ask(step) {
      await this.typing(550);
      const c = C();
      const progress = ORDER.indexOf(step) + 1;
      this.addBot(`<span class="mb-1 block text-[10px] uppercase tracking-[0.2em] text-copper-300">${fill(c.step, { n: progress, total: ORDER.length })}</span>${c.q[step]}`);
      this.setQuick(stepOptions(step));
    }

    async advance() {
      const step = this.nextStep();
      if (step) return this.ask(step);
      return this.showRecommendations();
    }

    async showRecommendations() {
      await this.typing(1100);
      const m = C().m;
      const recs = recommend(this.profile);
      const summary = Object.entries(this.profile)
        .map(([k, v]) => label(k, v))
        .filter(Boolean)
        .map((l) => `<span class="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-bone-200">${l}</span>`)
        .join(" ");
      this.addBot(`${m.analysed}<div class="my-2 flex flex-wrap gap-1">${summary}</div>${m.recs}`, this.cards(recs, this.profile));
      const opts = [];
      if (this.profile.tier === 3 || this.profile.tier === 2) opts.push(act("system", "system"));
      opts.push(act("restart", "restart"), act("human", "human"));
      this.setQuick(opts);
    }

    async handleOption(set, text) {
      this.addUser(text);
      if (set.action) return this.runAction(set.action);
      Object.assign(this.profile, set);
      return this.advance();
    }

    async runAction(action) {
      const m = C().m;
      switch (action) {
        case "start":
          return this.ask("material");
        case "start-maint":
          await this.typing(600);
          this.addBot(m.maint);
          this.profile.tier = 1;
          return this.ask("material");
        case "bestsellers":
          await this.typing(700);
          this.addBot(m.best, this.cards(products.filter((p) => p.bestseller).slice(0, 3)));
          return this.setQuick([act("mine", "start"), act("human", "human")]);
        case "system":
          await this.typing(800);
          this.addBot(m.system, this.cards(["ev-gen-vg15", "ev-block-vb4", "ev-hose-pu86"].map(getProduct)));
          return this.setQuick([act("restart", "restart"), act("human", "human")]);
        case "human":
          await this.typing(600);
          this.addBot(C().faq.contact + m.humanTail);
          return this.setQuick([act("keep", "start")]);
        case "restart":
          return this.greet();
      }
    }

    async handleText(text) {
      this.addUser(text);
      const t = norm(text);
      const c = C(), m = c.m;

      // Wynik z kalkulatora siły trzymania
      const calcD = /kalkulator|calculator|rechner/.test(t) && t.match(/min\.?\s*(\d+)\s*mm/);
      if (calcD) {
        const dMin = Number(calcD[1]);
        const fits = Object.entries(EVERSON.cupDiameters || {}).filter(([, d]) => d >= dMin).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([id]) => getProduct(id));
        await this.typing(900);
        if (fits.length) {
          this.addBot(fill(m.calcOk, { d: dMin }), this.cards(fits));
          return this.setQuick(stepOptions("surface"));
        }
        this.addBot(fill(m.calcNo, { d: dMin }), this.cards([getProduct("ev-mat-sm600")]));
        return this.setQuick([act("human", "human"), act("restart", "restart")]);
      }

      const named = products.find((p) => t.includes(norm(p.name)) || t.includes(norm(p.name.split(" ")[0])));
      const found = {};
      KEYWORDS.forEach((k) => { if (k.re.test(t)) Object.entries(k.set).forEach(([kk, v]) => { if (found[kk] === undefined) found[kk] = v; }); });
      const faq = FAQ.find((f) => f.re.test(t));

      if (named && /sprawdzi|pasuje|nada|czy |will|work|fit|suitable|passt|geeignet/.test(t)) {
        await this.typing(800);
        this.addBot(fill(m.fit, { name: escapeHtml(named.name), benefit: escapeHtml(pf(named, "benefit")) }), this.cards([named]));
        Object.assign(this.profile, found);
        return this.advance();
      }

      if (faq) {
        await this.typing(750);
        this.addBot(c.faq[faq.key], faq.show ? this.cards(faq.show.map(getProduct)) : "");
        if (Object.keys(found).length) { Object.assign(this.profile, found); return this.advance(); }
        return this.setQuick([act("pick", "start"), act("best", "bestsellers")]);
      }

      if (Object.keys(found).length) {
        Object.assign(this.profile, found);
        const understood = Object.entries(found).map(([k, v]) => label(k, v)).filter(Boolean).join(", ");
        await this.typing(600);
        this.addBot(fill(m.noted, { what: understood }));
        return this.advance();
      }

      if (named) {
        await this.typing(700);
        this.addBot(`${escapeHtml(pf(named, "headline"))} ${escapeHtml(pf(named, "benefit"))}`, this.cards([named]));
        return this.setQuick([act("mine", "start")]);
      }

      if (/^(hej|czesc|dzien dobry|witam|siema|hello|hi\b|hey|good (morning|afternoon)|hallo|guten tag|servus|moin)/.test(t)) {
        await this.typing(500);
        this.addBot(m.hello);
        return this.setQuick([act("pick", "start"), act("best", "bestsellers")]);
      }

      if (/dziek|super|ok\b|swietnie|thank|great|perfect|danke|prima|toll/.test(t)) {
        await this.typing(500);
        this.addBot(m.thanks);
        return this.setQuick([act("restart", "restart"), act("human", "human")]);
      }

      await this.typing(700);
      this.addBot(m.fallback);
      this.setQuick([act("guide", "start"), act("human", "human")]);
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
    fab.querySelector(".fab-label").textContent = I18N.t(open ? "fab.close" : "fab.open");
    panel.setAttribute("aria-label", C().title);
    if (open) setTimeout(() => floating.input.focus({ preventScroll: true }), 250);
  };
  setOpen(false);
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

  document.addEventListener("everson:lang", () => {
    inline?.relocalize();
    floating.relocalize();
    setOpen(panel.dataset.open === "true");
  });

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
