/* ==========================================================================
   Everson — interakcje strony: nagłówek, wyszukiwarka, filtry, koszyk,
   szybki podgląd, animacje hero i reveal.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const { products, categories, industries, formatPrice, starsSvg, renderVisual, getProduct, pf, catLabel, indLabel, fmtNum } = EVERSON;
  const I18N = EVERSON.i18n;
  const t = (key, vars) => I18N.t(key, vars);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const icon = {
    eye: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    bag: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke-linecap="round"/></svg>`,
    close: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/></svg>`,
    check: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    temp: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z"/></svg>`,
  };

  /* ---------------------------------------------------------------------
     Toasty
     --------------------------------------------------------------------- */
  const toast = (message) => {
    const el = document.createElement("div");
    el.className = "toast glass-strong pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-bone-50 shadow-2xl";
    el.innerHTML = `<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-copper-400 text-ink-950">${icon.check}</span><span>${message}</span>`;
    $("#toast-region").appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .4s, transform .4s";
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 400);
    }, 2800);
  };

  /* ---------------------------------------------------------------------
     Nagłówek: sticky + menu mobilne
     --------------------------------------------------------------------- */
  const header = $("#site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const togglePanel = (btn, panel, force) => {
    const open = force ?? panel.classList.contains("hidden");
    panel.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", String(open));
    return open;
  };
  const menuBtn = $("#menu-toggle"), menu = $("#mobile-menu");
  const searchBtn = $("#search-toggle"), mSearch = $("#mobile-search");
  menuBtn.addEventListener("click", () => {
    togglePanel(searchBtn, mSearch, false);
    togglePanel(menuBtn, menu);
  });
  searchBtn.addEventListener("click", () => {
    togglePanel(menuBtn, menu, false);
    if (togglePanel(searchBtn, mSearch)) $("#search-input-m").focus();
  });
  $$("a", menu).forEach((a) => a.addEventListener("click", () => togglePanel(menuBtn, menu, false)));

  [$("#account-btn"), $("[data-account]")].forEach((b) => b?.addEventListener("click", () => {
    togglePanel(menuBtn, menu, false);
    toast(t("account.soon"));
  }));

  /* ---------------------------------------------------------------------
     Karty produktów
     --------------------------------------------------------------------- */
  const unitStr = (p) => (p.unit ? ` / ${t(`unit.${p.unit}`)}` : "");

  const productCard = (p) => `
    <article class="product-card reveal glass group relative flex flex-col overflow-hidden rounded-3xl" data-id="${p.id}">
      <div class="studio relative aspect-[5/4] overflow-hidden">
        <div class="absolute inset-[10%]">${renderVisual(p)}</div>
        <div class="absolute left-4 top-4 flex flex-wrap gap-1.5">
          ${p.bestseller ? `<span class="rounded-full bg-copper-400 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-950">${t("badge.bestseller")}</span>` : ""}
          <span class="rounded-full border border-white/10 bg-ink-950/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-bone-300 backdrop-blur">${escapeHtml(p.diameter)}</span>
        </div>
        <div class="card-actions absolute inset-x-4 bottom-4 flex gap-2">
          <button type="button" data-quickview="${p.id}" class="glass-strong flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-medium text-bone-50 hover:border-copper-300/40">${icon.eye} ${t("card.quickview")}</button>
          <button type="button" data-add="${p.id}" class="btn-copper grid h-10 w-10 shrink-0 place-items-center rounded-full" aria-label="${escapeHtml(t("card.add", { name: p.name }))}">${icon.bag}</button>
        </div>
      </div>
      <div class="flex flex-1 flex-col p-5">
        <div class="flex items-center justify-between gap-2 text-xs text-bone-400">
          <span>${catLabel(p.category)}</span>
          <span class="flex items-center gap-1.5">${starsSvg(p.rating, 12)}<span>(${p.reviews})</span></span>
        </div>
        <h3 class="mt-3 font-serif text-xl text-bone-50">
          <button type="button" data-quickview="${p.id}" class="text-left after:absolute after:inset-0 after:content-[''] focus:outline-none">${escapeHtml(p.name)}</button>
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-bone-400">${escapeHtml(pf(p, "benefit"))}</p>
        <div class="mt-auto flex items-end justify-between pt-5">
          <p><span class="text-xs text-bone-400">${t("price.from")}</span> <span class="font-serif text-2xl text-bone-50">${formatPrice(p.price)}</span><span class="text-xs text-bone-400"> ${t("price.net")}${unitStr(p)}</span></p>
          <span class="flex items-center gap-1 text-xs text-bone-400">${icon.temp}${p.temp[0]}…${p.temp[1]}°C</span>
        </div>
      </div>
    </article>`;
  // Przyciski w karcie muszą być nad „rozciągniętym” linkiem tytułu.
  const liftActions = (root) => $$(".card-actions", root).forEach((el) => (el.style.zIndex = 2));

  /* ---------------------------------------------------------------------
     Bestsellery
     --------------------------------------------------------------------- */
  const bestGrid = $("#bestseller-grid");
  const renderBest = () => {
    bestGrid.innerHTML = products.filter((p) => p.bestseller).slice(0, 4).map(productCard).join("");
    liftActions(bestGrid);
  };
  renderBest();

  /* ---------------------------------------------------------------------
     Kolekcje: filtrowanie i sortowanie
     --------------------------------------------------------------------- */
  const state = { category: "all", industry: "all", sort: "popular" };
  const chipsWrap = $("#category-chips");
  const industrySelect = $("#industry-filter");
  const renderFilters = () => {
    chipsWrap.innerHTML = categories
      .map((c) => `<button type="button" class="chip rounded-full border border-white/10 px-4 py-2 text-sm text-bone-300 hover:border-copper-300/40 hover:text-bone-50" data-cat="${c.id}" aria-pressed="${c.id === state.category}">${catLabel(c.id)}</button>`)
      .join("");
    industrySelect.innerHTML = ["all", ...Object.keys(industries)]
      .map((k) => `<option value="${k}"${k === state.industry ? " selected" : ""}>${indLabel(k)}</option>`).join("");
  };
  renderFilters();

  const grid = $("#product-grid");
  const renderGrid = () => {
    let list = products.filter(
      (p) => (state.category === "all" || p.category === state.category) &&
             (state.industry === "all" || p.industries.includes(state.industry))
    );
    const sorters = {
      popular: (a, b) => b.reviews - a.reviews,
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name, I18N.locale),
    };
    list = list.sort(sorters[state.sort]);
    grid.innerHTML = list.map(productCard).join("");
    liftActions(grid);
    $("#empty-state").classList.toggle("hidden", list.length > 0);
    const n = list.length;
    $("#results-count").textContent = t("results", { n });
    observeReveal(grid);
  };

  const setCategory = (cat) => {
    state.category = cat;
    $$(".chip", chipsWrap).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
    renderGrid();
  };
  chipsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (btn) setCategory(btn.dataset.cat);
  });
  industrySelect.addEventListener("change", () => { state.industry = industrySelect.value; renderGrid(); });
  $("#sort-select").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
  $$("[data-filter-link]").forEach((a) => a.addEventListener("click", () => setCategory(a.dataset.filterLink)));

  /* ---------------------------------------------------------------------
     Wyszukiwarka z autouzupełnianiem
     --------------------------------------------------------------------- */
  const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
  // Indeks obejmuje wszystkie języki — wyszukiwanie działa niezależnie od wersji strony.
  const allLangs = (key) => I18N.SUPPORTED.map((l) => I18N.ui[l][key] || "");
  const searchIndex = products.map((p) => ({
    p,
    text: normalize([
      p.name, p.material, p.benefit, p.headline, ...allLangs(`cat.${p.category}`),
      ...Object.values(EVERSON.content.products[p.id] || {}).flatMap((x) => [x.benefit, x.headline]),
      ...p.industries.flatMap((i) => allLangs(`ind.${i}`)),
    ].join(" ")),
  }));
  const search = (q) => {
    const terms = normalize(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return searchIndex
      .map(({ p, text }) => ({ p, score: terms.reduce((s, t) => s + (text.includes(t) ? (normalize(p.name).includes(t) ? 3 : 1) : -99), 0) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.p);
  };
  const highlight = (text, q) => {
    const safe = escapeHtml(text);
    const t = q.trim();
    if (!t) return safe;
    const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    return safe.replace(re, '<mark class="bg-transparent text-copper-300">$1</mark>');
  };

  const setupSearch = (input, list) => {
    let active = -1;
    let results = [];
    const close = () => { list.classList.add("hidden"); input.setAttribute("aria-expanded", "false"); active = -1; };
    const render = () => {
      const q = input.value;
      results = search(q);
      if (!q.trim()) return close();
      list.innerHTML = results.length
        ? results.map((p, i) => `
            <li id="${list.id}-opt-${i}" role="option" aria-selected="${i === active}" data-id="${p.id}"
                class="suggest-item flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-white/5">
              <span class="studio relative block h-12 w-12 shrink-0 overflow-hidden rounded-lg"><span class="absolute inset-1 block">${renderVisual(p)}</span></span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm text-bone-50">${highlight(p.name, q)}</span>
                <span class="block truncate text-xs text-bone-400">${catLabel(p.category)} · ${formatPrice(p.price)}</span>
              </span>
            </li>`).join("")
        : `<li class="px-3 py-4 text-sm text-bone-400">${t("search.none")} <button type="button" data-open-advisor class="text-copper-300 underline underline-offset-2">${t("search.ask")}</button></li>`;
      list.classList.remove("hidden");
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-activedescendant", active >= 0 ? `${list.id}-opt-${active}` : "");
    };
    const choose = (id) => { close(); input.value = ""; openQuickView(id); };

    input.addEventListener("input", () => { active = -1; render(); });
    input.addEventListener("focus", render);
    input.addEventListener("keydown", (e) => {
      if (list.classList.contains("hidden")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, results.length - 1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
      else if (e.key === "Enter" && results.length) { e.preventDefault(); choose(results[Math.max(active, 0)].id); }
      else if (e.key === "Escape") close();
    });
    list.addEventListener("mousedown", (e) => {
      const li = e.target.closest("[data-id]");
      if (li) { e.preventDefault(); choose(li.dataset.id); }
    });
    input.addEventListener("blur", () => setTimeout(close, 120));
  };
  setupSearch($("#search-input"), $("#search-suggest"));
  setupSearch($("#search-input-m"), $("#search-suggest-m"));

  /* ---------------------------------------------------------------------
     Koszyk (localStorage jako wygoda — strona działa także bez niego)
     --------------------------------------------------------------------- */
  const CART_KEY = "everson-cart-v1";
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { cart = {}; }
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* tryb prywatny */ } };

  const renderCart = () => {
    const entries = Object.entries(cart).filter(([id]) => getProduct(id));
    const count = entries.reduce((s, [, q]) => s + q, 0);
    const net = entries.reduce((s, [id, q]) => s + getProduct(id).price * q, 0);
    const badge = $("#cart-count");
    badge.textContent = count;
    badge.classList.toggle("hidden", !count);
    badge.classList.toggle("grid", !!count);
    $("#cart-btn").setAttribute("aria-label", t("cart.aria", { n: count }));
    $("#cart-net").textContent = formatPrice(net);
    $("#cart-vat").textContent = formatPrice(net * 0.23);
    $("#cart-total").textContent = formatPrice(net * 1.23);
    $("#cart-items").innerHTML = entries.length
      ? entries.map(([id, q]) => {
          const p = getProduct(id);
          return `<div class="flex gap-4 border-b border-white/5 py-4">
            <div class="studio relative h-20 w-20 shrink-0 overflow-hidden rounded-xl"><div class="absolute inset-2">${renderVisual(p)}</div></div>
            <div class="flex min-w-0 flex-1 flex-col">
              <p class="truncate font-serif text-lg text-bone-50">${escapeHtml(p.name)}</p>
              <p class="text-xs text-bone-400">${formatPrice(p.price)} ${t("price.net")}${unitStr(p)}</p>
              <div class="mt-auto flex items-center justify-between pt-2">
                <div class="flex items-center rounded-full border border-white/10">
                  <button type="button" data-qty="-1" data-id="${id}" class="grid h-8 w-8 place-items-center text-bone-300 hover:text-bone-50" aria-label="${t("cart.dec")}">−</button>
                  <span class="w-8 text-center text-sm" aria-live="polite">${q}</span>
                  <button type="button" data-qty="1" data-id="${id}" class="grid h-8 w-8 place-items-center text-bone-300 hover:text-bone-50" aria-label="${t("cart.inc")}">+</button>
                </div>
                <button type="button" data-remove="${id}" class="text-xs text-bone-400 underline-offset-2 hover:text-copper-300 hover:underline">${t("cart.remove")}</button>
              </div>
            </div>
          </div>`;
        }).join("")
      : `<div class="grid h-full place-items-center py-16 text-center">
           <div>
             <p class="font-serif text-2xl text-bone-50">${t("cart.empty.title")}</p>
             <p class="mt-2 text-sm text-bone-400">${t("cart.empty.text")}</p>
             <button type="button" data-open-advisor class="btn-ghost mt-6 rounded-full border border-white/15 px-6 py-3 text-sm">${t("cart.empty.cta")}</button>
           </div>
         </div>`;
  };

  const addToCart = (id, qty = 1) => {
    const p = getProduct(id);
    if (!p) return;
    cart[id] = (cart[id] || 0) + qty;
    saveCart();
    renderCart();
    toast(t("cart.added", { name: escapeHtml(p.name) }));
    const b = $("#cart-btn");
    b.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }], { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" });
  };

  const drawer = $("#cart-drawer"), overlay = $("#cart-overlay");
  let lastFocus = null;
  const setCart = (open) => {
    drawer.dataset.open = overlay.dataset.open = String(open);
    drawer.setAttribute("aria-hidden", String(!open));
    $("#cart-btn").setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { lastFocus = document.activeElement; $("#cart-close").focus(); }
    else lastFocus?.focus?.();
  };
  $("#cart-btn").addEventListener("click", () => setCart(true));
  $("#cart-close").addEventListener("click", () => setCart(false));
  overlay.addEventListener("click", () => setCart(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.dataset.open === "true") setCart(false); });
  $("#cart-items").addEventListener("click", (e) => {
    const q = e.target.closest("[data-qty]");
    const r = e.target.closest("[data-remove]");
    if (q) {
      const id = q.dataset.id;
      cart[id] = Math.max(0, (cart[id] || 0) + Number(q.dataset.qty));
      if (!cart[id]) delete cart[id];
    } else if (r) delete cart[r.dataset.remove];
    else return;
    saveCart();
    renderCart();
  });
  $("#checkout-btn").addEventListener("click", () => {
    if (!Object.keys(cart).length) return toast(t("checkout.empty"));
    toast(t("checkout.ok"));
  });
  renderCart();

  /* ---------------------------------------------------------------------
     Szybki podgląd
     --------------------------------------------------------------------- */
  const qv = $("#quickview");
  let qvId = null;
  const openQuickView = (id) => {
    const p = getProduct(id);
    if (!p) return;
    qvId = id;
    $("#quickview-body").innerHTML = `
      <div class="grid md:grid-cols-2">
        <div class="studio relative aspect-square md:aspect-auto md:min-h-[520px]">
          <div class="absolute inset-[12%]">${renderVisual(p, { hero: true })}</div>
          ${p.bestseller ? `<span class="absolute left-5 top-5 rounded-full bg-copper-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-950">${t("badge.bestseller")}</span>` : ""}
        </div>
        <div class="flex max-h-[80svh] flex-col overflow-y-auto p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <p class="eyebrow">${catLabel(p.category)}</p>
            <button type="button" data-close-qv class="-mr-2 -mt-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-bone-300 hover:bg-white/5 hover:text-bone-50" aria-label="${t("qv.close")}">${icon.close}</button>
          </div>
          <h2 id="qv-title" class="mt-2 font-serif text-3xl text-bone-50 sm:text-4xl">${escapeHtml(p.name)}</h2>
          <p class="mt-2 font-serif text-lg italic text-copper-200">${escapeHtml(pf(p, "headline"))}</p>
          <div class="mt-3 flex items-center gap-2 text-sm text-bone-400">${starsSvg(p.rating)} <span>${t("qv.ratings", { r: fmtNum(p.rating), n: p.reviews })}</span></div>
          <p class="mt-5 text-sm leading-relaxed text-bone-300">${escapeHtml(pf(p, "description"))}</p>
          <dl class="mt-6 divide-y divide-white/5 rounded-2xl border border-white/10 text-sm">
            ${Object.entries(pf(p, "specs")).map(([k, v]) => `<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-bone-400">${k}</dt><dd class="text-right text-bone-100">${escapeHtml(v)}</dd></div>`).join("")}
          </dl>
          <div class="mt-4 flex flex-wrap gap-1.5">
            ${p.industries.map((i) => `<span class="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-bone-300">${indLabel(i)}</span>`).join("")}
          </div>
          <div class="mt-auto flex flex-col gap-3 pt-8 sm:flex-row sm:items-center">
            <p class="font-serif text-3xl text-bone-50">${formatPrice(p.price)}<span class="ml-1 text-xs text-bone-400">${t("price.net")}${unitStr(p)}</span></p>
            <button type="button" data-add="${p.id}" data-close-qv class="btn-copper flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold sm:ml-auto">${icon.bag} ${t("qv.add")}</button>
          </div>
          <button type="button" data-ask-advisor="${p.id}" class="mt-3 text-left text-xs text-bone-400 hover:text-copper-300">${t("qv.ask")} <span class="underline underline-offset-2">${t("qv.ask.link")}</span></button>
        </div>
      </div>`;
    if (!qv.open) qv.showModal();
  };
  qv.addEventListener("click", (e) => {
    if (e.target === qv || e.target.closest("[data-close-qv]")) qv.close();
  });

  /* ---------------------------------------------------------------------
     Delegacja globalna: dodawanie, podgląd, doradca
     --------------------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { addToCart(add.dataset.add); return; }
    const view = e.target.closest("[data-quickview]");
    if (view) { openQuickView(view.dataset.quickview); return; }
    const ask = e.target.closest("[data-ask-advisor]");
    if (ask) { qv.close(); EVERSON.advisor?.open(t("advisor.askProduct", { name: getProduct(ask.dataset.askAdvisor).name })); return; }
    if (e.target.closest("[data-open-advisor]")) {
      if (drawer.dataset.open === "true") setCart(false);
      EVERSON.advisor?.open();
    }
  });

  /* ---------------------------------------------------------------------
     Treści dekoracyjne: marquee, hero, opinie, galeria
     --------------------------------------------------------------------- */
  const marqueeItem = (s) => `<li class="flex items-center gap-14"><span>${s}</span><span class="h-1.5 w-1.5 rounded-full bg-copper-400/70" aria-hidden="true"></span></li>`;
  const insta = ["ev-foam-60", "ev-food-30", "ev-gen-vg15", "ev-wafer-20", "ev-bottle-bg3", "ev-heat-50"];
  const quote = { pl: ["„", "”"], en: ["“", "”"], de: ["„", "“"] };

  const renderDecor = () => {
    const sectors = I18N.pick(EVERSON.content.sectors);
    $("#marquee-list").innerHTML = [...sectors, ...sectors].map(marqueeItem).join("");
    $$("#marquee-list li").slice(sectors.length).forEach((li) => li.setAttribute("aria-hidden", "true"));

    $("#hero-product").innerHTML = renderVisual(getProduct("ev-bellow-25"), { hero: true });
    $("#about-visual").innerHTML = renderVisual(getProduct("ev-gen-vg15"), { hero: true });
    $("#avg-stars").innerHTML = starsSvg(4.9, 16);

    // PRZYKŁADOWE opinie (i18n-content.js) — zastąp zweryfikowanymi opiniami klientów.
    const [qo, qc] = quote[I18N.lang];
    $("#reviews-grid").innerHTML = EVERSON.content.reviews.map((r) => {
      const c = I18N.pick(r);
      return `
      <figure class="reveal is-visible glass flex flex-col rounded-3xl p-7 transition duration-500 hover:-translate-y-1 hover:border-copper-300/25">
        <div class="flex items-center justify-between">${starsSvg(r.rating)}<svg class="h-7 w-7 text-copper-300/40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.5 6C6.5 7 5 9.5 5 13v5h5v-5H7.5c0-2 .8-3.6 2.8-4.5L9.5 6Zm9 0C15.5 7 14 9.5 14 13v5h5v-5h-2.5c0-2 .8-3.6 2.8-4.5L18.5 6Z"/></svg></div>
        <blockquote class="mt-5 flex-1 text-[15px] leading-relaxed text-bone-200">${qo}${c.text}${qc}</blockquote>
        <figcaption class="mt-6 flex items-center gap-3 border-t border-white/5 pt-5">
          <span class="grid h-11 w-11 place-items-center rounded-full font-serif text-lg text-white" style="background:linear-gradient(135deg,hsl(${r.hue} 45% 45%),hsl(${r.hue + 30} 35% 22%))" aria-hidden="true">${r.name[0]}</span>
          <span><span class="block text-sm font-medium text-bone-50">${r.name}</span><span class="block text-xs text-bone-400">${c.role} · ${c.company}</span></span>
        </figcaption>
      </figure>`;
    }).join("");

    $("#insta-grid").innerHTML = insta.map((id) => {
      const p = getProduct(id);
      return `<li class="reveal is-visible">
        <button type="button" data-quickview="${id}" class="studio group relative block aspect-square w-full overflow-hidden rounded-2xl border border-white/5" aria-label="${escapeHtml(t("insta.view", { name: p.name }))}">
          <span class="absolute inset-[14%] block transition duration-700 group-hover:scale-110">${renderVisual(p)}</span>
          <span class="absolute inset-0 grid place-items-center bg-ink-950/60 opacity-0 transition duration-500 group-hover:opacity-100">
            <svg class="h-7 w-7 text-bone-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01" stroke-linecap="round"/></svg>
          </span>
        </button>
      </li>`;
    }).join("");
  };
  renderDecor();
  // Pierwsze wejście: opinie i galeria pojawiają się z animacją.
  $$("#reviews-grid .reveal, #insta-grid .reveal").forEach((el) => el.classList.remove("is-visible"));

  /* ---------------------------------------------------------------------
     Newsletter
     --------------------------------------------------------------------- */
  $("#newsletter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#nl-email"), consent = $("#nl-consent"), msg = $("#nl-msg");
    msg.className = "min-h-[1.5rem] text-sm";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      msg.textContent = t("nl.invalid");
      msg.classList.add("text-red-300");
      email.focus();
      return;
    }
    if (!consent.checked) {
      msg.textContent = t("nl.consent");
      msg.classList.add("text-red-300");
      return;
    }
    msg.innerHTML = t("nl.ok", { code: `<strong class="rounded bg-copper-400/15 px-2 py-0.5 font-mono text-copper-200">EVERSON10</strong>` });
    msg.classList.add("text-bone-100");
    e.target.reset();
  });

  $("#year").textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------------------- */
  const io = "IntersectionObserver" in window && !reducedMotion
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 })
    : null;
  function observeReveal(root = document) {
    $$(".reveal:not(.is-visible)", root).forEach((el, i) => {
      if (!io) return el.classList.add("is-visible");
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
      io.observe(el);
    });
  }
  renderGrid();
  observeReveal();

  /* ---------------------------------------------------------------------
     Linki wewnątrz strony (#sekcja) — przewijamy skryptem, dzięki czemu
     działają także w podglądzie osadzonym w innej stronie (iframe/srcdoc),
     gdzie sam „#” prowadziłby do adresu strony nadrzędnej.
     --------------------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    const target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    if (id === "main" || target.matches("section,footer,main")) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
    try { history.replaceState(null, "", `#${id}`); } catch { /* podgląd bez historii */ }
  });

  /* ---------------------------------------------------------------------
     Zmiana języka — odświeżenie treści generowanych w JS
     --------------------------------------------------------------------- */
  document.addEventListener("everson:lang", () => {
    renderBest();
    renderFilters();
    renderGrid();
    renderCart();
    renderDecor();
    $("#nl-msg").textContent = "";
    if (qv.open && qvId) openQuickView(qvId);
    $$(".reveal", document).forEach((el) => el.classList.add("is-visible"));
  });

  /* ---------------------------------------------------------------------
     Hero: kinowa pętla — pole podciśnienia (cząsteczki zasysane do centrum)
     --------------------------------------------------------------------- */
  const video = $("#hero-video");
  if (video?.dataset.src && !reducedMotion) {
    video.addEventListener("canplay", () => video.classList.replace("opacity-0", "opacity-40"), { once: true });
    video.addEventListener("error", () => video.remove(), { once: true });
    video.src = video.dataset.src;
  }

  const canvas = $("#hero-canvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1, particles = [], raf = 0, running = true;
  const resize = () => {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round(Math.min(140, (W * H) / 9000));
    particles = Array.from({ length: count }, spawn);
  };
  const center = () => ({ x: W > 1024 ? W * 0.72 : W * 0.5, y: W > 1024 ? H * 0.5 : H * 0.72 });
  function spawn() {
    const a = Math.random() * Math.PI * 2;
    const r = Math.max(W, H) * (0.45 + Math.random() * 0.4);
    const c = center();
    return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, a, r, s: 0.0015 + Math.random() * 0.003, w: 0.4 + Math.random() * 1.4, life: Math.random() };
  }
  const tick = () => {
    const c = center();
    ctx.fillStyle = "rgba(9,9,11,0.22)";
    ctx.fillRect(0, 0, W, H);
    for (const p of particles) {
      p.a += 0.0025 + (1 - p.r / Math.max(W, H)) * 0.004;
      p.r *= 1 - p.s;
      const nx = c.x + Math.cos(p.a) * p.r;
      const ny = c.y + Math.sin(p.a) * p.r * 0.62;
      const alpha = Math.min(1, p.r / 120) * 0.55;
      ctx.strokeStyle = `rgba(233,184,147,${alpha})`;
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      p.x = nx; p.y = ny;
      if (p.r < 40) Object.assign(p, spawn());
    }
    if (running) raf = requestAnimationFrame(tick);
  };
  resize();
  window.addEventListener("resize", () => { cancelAnimationFrame(raf); resize(); if (running) tick(); });
  if (reducedMotion) { running = false; tick(); }
  else {
    // Pauza animacji, gdy hero nie jest widoczne (oszczędność baterii).
    new IntersectionObserver(([en]) => {
      const vis = en.isIntersecting;
      if (vis && !running) { running = true; tick(); }
      else if (!vis) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
    tick();
  }

  /* API dla doradcy AI */
  EVERSON.ui = { openQuickView, addToCart, setCategory, toast, escapeHtml };
})();
