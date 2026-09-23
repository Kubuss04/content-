/* ==========================================================================
   Everson — wielojęzyczność (PL / EN / DE)
   --------------------------------------------------------------------------
   • Statyczny HTML jest napisany po polsku. Przy zmianie języka tłumaczymy
     węzły tekstowe i atrybuty (placeholder, aria-label, title, alt) według
     słownika `EVERSON.i18n.static` (klucz = oryginalny tekst PL).
     Elementy oznaczone `data-i18n-skip` renderuje JavaScript i są pomijane.
   • Treści generowane w JS korzystają z `EVERSON.i18n.t(klucz, zmienne)`.
   • Wybór języka: ?lang=en w adresie > zapamiętany wybór > polski.
   ========================================================================== */
window.EVERSON = window.EVERSON || {};

(() => {
  "use strict";

  const SUPPORTED = ["pl", "en", "de"];
  const LOCALES = { pl: "pl-PL", en: "en-GB", de: "de-DE" };
  const STORE_KEY = "everson-lang";

  let lang = "pl";
  try {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    const saved = localStorage.getItem(STORE_KEY);
    lang = SUPPORTED.includes(fromUrl) ? fromUrl : SUPPORTED.includes(saved) ? saved : "pl";
  } catch { /* brak dostępu do storage/URL — zostaje polski */ }

  const I = (EVERSON.i18n = {
    SUPPORTED,
    ui: { pl: {}, en: {}, de: {} },   // klucze dla treści generowanych w JS
    static: { en: {}, de: {} },        // tekst PL → tłumaczenie (statyczny HTML)
    get lang() { return lang; },
    get locale() { return LOCALES[lang]; },

    /** Tłumaczenie klucza z podstawieniem {zmiennych}. */
    t(key, vars) {
      let s = I.ui[lang]?.[key] ?? I.ui.pl[key] ?? key;
      if (typeof s === "function") return s(vars || {});
      if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
      return s;
    },

    /** Wybór wartości z obiektu {pl, en, de}. */
    pick(obj) { return obj?.[lang] ?? obj?.pl; },

    setLang(next) {
      if (!SUPPORTED.includes(next) || next === lang) return;
      lang = next;
      try { localStorage.setItem(STORE_KEY, lang); } catch { /* tryb prywatny */ }
      applyStatic();
      syncSwitcher();
      document.dispatchEvent(new CustomEvent("everson:lang", { detail: { lang } }));
    },
  });

  /* ---------------- Tłumaczenie statycznego HTML ---------------- */
  const origText = new WeakMap();
  const origAttr = new WeakMap();
  const ATTRS = ["placeholder", "aria-label", "title", "alt"];
  const norm = (s) => s.trim().replace(/\s+/g, " ");
  const lookup = (pl) => (lang === "pl" ? null : I.static[lang]?.[norm(pl)]);
  const skip = (el) => !el || el.closest("[data-i18n-skip],script,style,svg");

  let docOrig = null;
  function applyStatic() {
    document.documentElement.lang = lang;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim() && !skip(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    for (let n; (n = walker.nextNode()); ) {
      if (!origText.has(n)) origText.set(n, n.nodeValue);
      const orig = origText.get(n);
      const tr = lookup(orig);
      // Zachowujemy białe znaki wokół tekstu (odstępy między fragmentami).
      n.nodeValue = tr ? orig.replace(/^(\s*)[\s\S]*?(\s*)$/, (_, a, b) => a + tr + b) : orig;
    }

    document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(",")).forEach((el) => {
      // data-i18n-attrs: element renderowany w JS, ale z własnymi statycznymi atrybutami
      if (el.hasAttribute("data-i18n-attrs") ? skip(el.parentElement) : skip(el)) return;
      if (!origAttr.has(el)) origAttr.set(el, Object.fromEntries(ATTRS.filter((a) => el.hasAttribute(a)).map((a) => [a, el.getAttribute(a)])));
      for (const [a, orig] of Object.entries(origAttr.get(el))) el.setAttribute(a, lookup(orig) || orig);
    });

    const desc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    docOrig ??= { title: document.title, desc: desc?.content, ogTitle: ogTitle?.content, ogDesc: ogDesc?.content };
    document.title = lookup(docOrig.title) || docOrig.title;
    if (desc) desc.content = lookup(docOrig.desc) || docOrig.desc;
    if (ogTitle) ogTitle.content = lookup(docOrig.ogTitle) || docOrig.ogTitle;
    if (ogDesc) ogDesc.content = lookup(docOrig.ogDesc) || docOrig.ogDesc;
    if (ogLocale) ogLocale.content = LOCALES[lang].replace("-", "_");
  }
  I.applyStatic = applyStatic;

  /* ---------------- Przełącznik języka ---------------- */
  const btn = document.getElementById("lang-btn");
  const menu = document.getElementById("lang-menu");
  function syncSwitcher() {
    const cur = document.getElementById("lang-current");
    if (cur) cur.textContent = lang.toUpperCase();
    document.querySelectorAll("[data-lang]").forEach((b) => {
      const on = b.dataset.lang === lang;
      b.setAttribute("aria-current", on ? "true" : "false");
      b.classList.toggle("text-copper-300", on);
    });
  }
  const setMenu = (open) => {
    if (!menu) return;
    menu.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", String(open));
  };
  btn?.addEventListener("click", (e) => { e.stopPropagation(); setMenu(menu.classList.contains("hidden")); });
  document.addEventListener("click", (e) => {
    const choice = e.target.closest("[data-lang]");
    if (choice) { I.setLang(choice.dataset.lang); setMenu(false); btn?.focus(); return; }
    if (!e.target.closest("#lang-switch")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // Uruchomienie po wczytaniu słowników (i18n-content.js ładuje się zaraz po tym pliku).
  I.init = () => { applyStatic(); syncSwitcher(); };
})();
