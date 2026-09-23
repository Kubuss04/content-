/* ==========================================================================
   Everson — film „Jak powstaje przyssawka”, kalkulator siły trzymania,
   paralaksa produktu w hero.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const { getProduct, renderVisual, formatPrice } = EVERSON;
  const { openQuickView, escapeHtml } = EVERSON.ui;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================================
     1. FILM — sceny SVG
     ========================================================================== */
  const DEFS = `
    <defs>
      <linearGradient id="c-metal" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#e6e6eb"/><stop offset=".45" stop-color="#8e8e97"/><stop offset=".55" stop-color="#6d6d76"/><stop offset="1" stop-color="#3a3a41"/>
      </linearGradient>
      <linearGradient id="c-metal-h" x1="0" x2="1">
        <stop offset="0" stop-color="#4a4a51"/><stop offset=".3" stop-color="#d9d9de"/><stop offset=".55" stop-color="#8b8b93"/><stop offset=".75" stop-color="#eeeef2"/><stop offset="1" stop-color="#4a4a51"/>
      </linearGradient>
      <linearGradient id="c-copper" x1="0" x2="1">
        <stop offset="0" stop-color="#6d4a2e"/><stop offset=".35" stop-color="#e9b893"/><stop offset=".6" stop-color="#a86a41"/><stop offset="1" stop-color="#f3d3b6"/>
      </linearGradient>
      <linearGradient id="c-rubber" x1="0" x2="1">
        <stop offset="0" stop-color="#141417"/><stop offset=".4" stop-color="#3b3b43"/><stop offset=".6" stop-color="#1e1e23"/><stop offset="1" stop-color="#0e0e11"/>
      </linearGradient>
      <radialGradient id="c-spot" cx=".5" cy=".3" r=".7">
        <stop offset="0" stop-color="#ffe7d2" stop-opacity=".16"/><stop offset="1" stop-color="#ffe7d2" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="c-hot" cx=".5" cy=".6" r=".6">
        <stop offset="0" stop-color="#ff7a2e" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a2e" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="c-laser" x1="0" x2="1">
        <stop offset="0" stop-color="#ff5a3c" stop-opacity="0"/><stop offset=".5" stop-color="#ff7a5c"/><stop offset="1" stop-color="#ff5a3c" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="c-box" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#c79a6b"/><stop offset="1" stop-color="#8a6440"/>
      </linearGradient>
    </defs>`;

  const floor = `
    <path d="M-400 252 H880" stroke="rgba(255,255,255,.08)"/>
    <ellipse cx="240" cy="262" rx="190" ry="10" fill="#000" opacity=".45"/>`;

  // Profil przyssawki (do formy, pieca, kontroli)
  const cup = (x, y, s = 1, fill = "url(#c-rubber)", cls = "") => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path class="${cls}" d="M-14 -36 h28 v14 h-28z" fill="url(#c-metal-h)"/>
      <path class="${cls}" d="M-20 -22 h40 l4 12 h-48z" fill="${fill}"/>
      <path class="${cls}" d="M-52 6 C-48 -14 48 -14 52 6 C52 14 -52 14 -52 6Z" fill="${fill}"/>
    </g>`;

  const SCENES = [
    /* 01 — Mieszanka: walce mieszające */
    `${floor}
     <g transform="translate(200 18)">
       <path d="M0 0 H80 L60 44 H20Z" fill="url(#c-metal)" opacity=".9"/>
       <text x="40" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="6" letter-spacing="1" fill="#1a1a1e">NBR · SI · EPDM</text>
     </g>
     ${Array.from({ length: 9 }, (_, i) => `<g transform="translate(${226 + (i % 3) * 14} ${64 + (i % 2) * 4})"><circle class="cin-fall" style="animation-delay:${(i * 0.2).toFixed(1)}s" r="${2 + (i % 3)}" fill="${["#2b2b31", "#d9d4cc", "#3b5f86"][i % 3]}"/></g>`).join("")}
     <rect x="120" y="196" width="240" height="56" rx="6" fill="#1c1c21" stroke="rgba(255,255,255,.06)"/>
     <path d="M140 120 C150 60 330 60 340 120" fill="none" stroke="#26262c" stroke-width="16" stroke-linecap="round"/>
     <path d="M140 120 C150 60 330 60 340 120" fill="none" class="cin-flow" stroke="#4a4a52" stroke-width="3"/>
     <g transform="translate(195 150)">
       <circle r="46" fill="url(#c-metal)"/>
       <g class="cin-spin">${[0, 45, 90, 135].map((a) => `<line x1="-44" y1="0" x2="44" y2="0" transform="rotate(${a})" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join("")}<circle r="46" fill="none"/></g>
       <circle r="10" fill="url(#c-copper)"/>
     </g>
     <g transform="translate(290 150)">
       <circle r="46" fill="url(#c-metal)"/>
       <g class="cin-spin-rev">${[0, 45, 90, 135].map((a) => `<line x1="-44" y1="0" x2="44" y2="0" transform="rotate(${a})" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join("")}<circle r="46" fill="none"/></g>
       <circle r="10" fill="url(#c-copper)"/>
     </g>
     <path d="M242 196 V250" stroke="#2a2a30" stroke-width="10"/>
     <path d="M242 196 V250" class="cin-flow" stroke="#55555e" stroke-width="2"/>
     <text x="40" y="236" font-family="Inter,sans-serif" font-size="9" letter-spacing="2.5" fill="#c9c2ba">WALCE · 60 °C</text>`,

    /* 02 — Formowanie wtryskowe */
    `${floor}
     <rect x="150" y="30" width="180" height="12" fill="#2a2a30"/>
     <rect x="162" y="30" width="10" height="190" fill="#2a2a30"/><rect x="308" y="30" width="10" height="190" fill="#2a2a30"/>
     <g class="cin-press">
       <rect x="150" y="60" width="180" height="60" rx="3" fill="url(#c-metal)"/>
       <path d="M188 120 C194 106 286 106 292 120Z" fill="#101013"/>
       <rect x="150" y="60" width="180" height="4" fill="#f1f1f4" opacity=".4"/>
     </g>
     <g transform="translate(0 0)">
       <rect x="150" y="170" width="180" height="62" rx="3" fill="url(#c-metal)"/>
       <path d="M188 170 C194 188 286 188 292 170Z" fill="#101013"/>
       <clipPath id="c-cavity"><path d="M188 170 C194 154 286 154 292 170 C286 188 194 188 188 170Z"/></clipPath>
       <g clip-path="url(#c-cavity)"><rect class="cin-fill" x="188" y="150" width="104" height="40" fill="#34343c"/><rect class="cin-fill" x="188" y="160" width="104" height="3" fill="#e9b893" opacity=".35"/></g>
     </g>
     <rect x="40" y="186" width="110" height="16" rx="3" fill="url(#c-metal)"/>
     <g class="cin-plunger"><rect x="12" y="182" width="40" height="24" rx="3" fill="url(#c-copper)"/></g>
     <g transform="translate(240 150)"><g class="cin-part">${cup(0, 0, 0.55)}</g></g>
     <g font-family="Inter,sans-serif" fill="#c9c2ba">
       <text x="350" y="92" font-size="9" letter-spacing="2.5">CIŚNIENIE</text>
       <text x="350" y="116" font-size="20" fill="#f7f3ee" font-family="Fraunces,serif">1 200 bar</text>
       <text x="350" y="146" font-size="9" letter-spacing="2.5">TOLERANCJA</text>
       <text x="350" y="168" font-size="16" fill="#e9b893" font-family="Fraunces,serif">± 0,05 mm</text>
     </g>`,

    /* 03 — Wulkanizacja */
    `${floor}
     <rect x="110" y="34" width="260" height="214" rx="16" fill="#131316" stroke="rgba(255,255,255,.1)"/>
     <rect x="126" y="50" width="228" height="182" rx="10" fill="url(#c-hot)"/>
     ${[0, 1, 2, 3, 4, 5].map((i) => `<g transform="translate(${150 + i * 36} 150)"><path class="cin-wave" style="animation-delay:${(i * 0.35).toFixed(2)}s" d="M0 30 q6 -8 0 -16 q-6 -8 0 -16 q6 -8 0 -16" fill="none" stroke="#ffb07a" stroke-width="1.5" opacity=".7"/></g>`).join("")}
     <g transform="translate(240 150)">
       <path class="cin-heat" d="M-14 -36 h28 v14 h-28z" fill="#3a2018"/>
       <path class="cin-heat" d="M-20 -22 h40 l4 12 h-48z" fill="#3a2018"/>
       <path class="cin-heat" d="M-52 6 C-48 -14 48 -14 52 6 C52 14 -52 14 -52 6Z" fill="#3a2018"/>
     </g>
     <path class="cin-coil" d="M136 214 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10 l12 -10 l12 10" fill="none" stroke="#7a2d12" stroke-width="3" stroke-linejoin="round"/>
     <text x="240" y="84" text-anchor="middle" font-family="Fraunces,serif" font-size="30" fill="#ffd9bd"><tspan id="cin-temp">20</tspan> °C</text>
     <text x="240" y="100" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" letter-spacing="3" fill="#c9c2ba">SIECIOWANIE · t = 6:00 min</text>`,

    /* 04 — Kontrola jakości */
    `${floor}
     <rect x="96" y="210" width="168" height="40" rx="4" fill="#1c1c21" stroke="rgba(255,255,255,.08)"/>
     ${cup(180, 196, 1)}
     <g transform="translate(0 150)"><g class="cin-scan">
       <rect x="100" y="0" width="160" height="2" fill="url(#c-laser)"/>
       <rect x="100" y="-6" width="160" height="14" fill="url(#c-laser)" opacity=".18"/>
     </g></g>
     <g stroke="#e9b893" stroke-width="1" fill="none" opacity=".8">
       <path d="M128 226 V240 M232 226 V240 M128 236 H232"/>
     </g>
     <text x="180" y="248" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" letter-spacing="1.5" fill="#e9b893">Ø 40,00 ±0,05 mm</text>
     <g transform="translate(360 140)">
       <circle r="66" fill="#141417" stroke="url(#c-metal-h)" stroke-width="4"/>
       ${Array.from({ length: 11 }, (_, i) => {
         const a = (-120 + i * 20) * Math.PI / 180;
         return `<line x1="${(Math.sin(a) * 50).toFixed(1)}" y1="${(-Math.cos(a) * 50).toFixed(1)}" x2="${(Math.sin(a) * 58).toFixed(1)}" y2="${(-Math.cos(a) * 58).toFixed(1)}" stroke="${i > 8 ? "#6ee7a8" : "#8b8b93"}" stroke-width="2"/>`;
       }).join("")}
       <text y="30" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" letter-spacing="2" fill="#a8a199">BAR</text>
       <text y="46" text-anchor="middle" font-family="Fraunces,serif" font-size="14" fill="#f7f3ee">-0,9</text>
       <g class="cin-needle" style="transform-origin:0 0"><path d="M-2 6 L0 -52 L2 6Z" fill="#e9b893"/></g>
       <circle r="6" fill="url(#c-copper)"/>
     </g>
     <g transform="translate(420 70)"><g class="cin-ok">
       <circle r="16" fill="#1f5a3f" stroke="#6ee7a8"/>
       <path d="M-7 0 l5 5 l9 -10" stroke="#e9fff4" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
     </g></g>`,

    /* 05 — W akcji: portal pick & place */
    `${floor}
     <rect x="40" y="36" width="400" height="12" rx="3" fill="url(#c-metal)"/>
     <rect x="40" y="48" width="6" height="204" fill="#2a2a30"/><rect x="434" y="48" width="6" height="204" fill="#2a2a30"/>
     <rect x="60" y="222" width="110" height="30" rx="3" fill="#2a2320"/>
     <rect x="260" y="226" width="180" height="16" rx="8" fill="#1c1c21"/>
     <path d="M268 234 H432" class="cin-belt" stroke="#3a3a42" stroke-width="3"/>
     <g class="cin-box"><rect x="84" y="182" width="62" height="40" rx="3" fill="url(#c-box)"/><path d="M84 196 H146" stroke="#6d4a2e" stroke-width="1.5" opacity=".7"/><text x="115" y="214" text-anchor="middle" font-family="Inter,sans-serif" font-size="7" letter-spacing="1.5" fill="#3d2a1a">EVERSON</text></g>
     <g class="cin-carriage">
       <g class="cin-tool">
         <rect x="111" y="40" width="8" height="98" fill="url(#c-metal-h)"/>
         <path d="M103 138 h24 l6 12 h-36z" fill="url(#c-rubber)"/>
         <path d="M93 152 C96 144 134 144 137 152 C137 158 93 158 93 152Z" fill="#26262b"/>
       </g>
       <rect x="92" y="28" width="46" height="30" rx="4" fill="url(#c-copper)"/>
       <circle class="cin-led" cx="130" cy="36" r="3" fill="#c8875a"/>
       <text x="102" y="50" font-family="Inter,sans-serif" font-size="6" letter-spacing="1" fill="#2a1a10">VG 15</text>
     </g>
     <text x="440" y="24" text-anchor="end" font-family="Inter,sans-serif" font-size="8" letter-spacing="2.5" fill="#c9c2ba">PICK &amp; PLACE · 42 CYKLE/MIN</text>`,
  ];

  const CAPTIONS = [
    "Wszystko zaczyna się od receptury.",
    "Setne części milimetra. W każdej sztuce.",
    "180 °C. Tu rodzi się sprężystość.",
    "Trzyma albo nie wychodzi z hali.",
    "Pierwszy chwyt. I milion kolejnych.",
  ];

  const stage = $("#cinema");
  if (stage) {
    const holder = $("#cinema-scenes");
    holder.innerHTML = `<svg viewBox="0 0 480 300" class="h-full w-full overflow-visible" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${DEFS}${SCENES.map((s, i) => `<g class="scene${i === 0 ? " is-active" : ""}" data-scene="${i}">${s}</g>`).join("")}</svg>`;
    const scenes = $$(".scene", holder);
    const segWrap = $("#cinema-segments");
    segWrap.innerHTML = SCENES.map((_, i) => `
      <li class="seg flex-1"><button type="button" data-seg="${i}" class="block w-full py-2" aria-label="Scena ${i + 1}: ${CAPTIONS[i]}">
        <span class="block h-[3px] overflow-hidden rounded-full bg-white/20"><span class="seg-fill block h-full bg-copper-300"></span></span>
      </button></li>`).join("");
    const segs = $$(".seg", segWrap);
    const steps = $$("#process-steps [data-step]");
    const caption = $("#cinema-caption");
    const chapter = $("#cinema-chapter");
    const playBtn = $("#cinema-play");
    const SCENE_MS = 5200;
    let current = -1, playing = false, timer = 0, typeTimer = 0;

    const typeCaption = (text) => {
      clearInterval(typeTimer);
      if (reducedMotion) { caption.textContent = text; return; }
      let i = 0;
      caption.textContent = "";
      typeTimer = setInterval(() => {
        caption.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(typeTimer);
      }, 32);
    };

    const show = (i) => {
      if (i === current) return;
      current = i;
      scenes.forEach((s, n) => s.classList.toggle("is-active", n === i));
      segs.forEach((s, n) => { s.classList.toggle("is-active", n === i); s.classList.toggle("is-done", n < i); });
      steps.forEach((s, n) => s.classList.toggle("is-current", n === i));
      chapter.textContent = `Scena ${String(i + 1).padStart(2, "0")} / ${String(SCENES.length).padStart(2, "0")}`;
      typeCaption(CAPTIONS[i]);
      if (i === 2) runTemp();
      if (playing) { clearTimeout(timer); timer = setTimeout(() => show((current + 1) % SCENES.length), SCENE_MS); }
    };

    // Licznik temperatury w scenie wulkanizacji
    let tempRaf = 0;
    const runTemp = () => {
      const el = $("#cin-temp");
      cancelAnimationFrame(tempRaf);
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 2600);
        el.textContent = Math.round(20 + (180 - 20) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) tempRaf = requestAnimationFrame(step);
      };
      tempRaf = requestAnimationFrame(step);
    };

    const setPlaying = (on) => {
      playing = on;
      stage.classList.toggle("is-playing", on);
      playBtn.setAttribute("aria-pressed", String(on));
      playBtn.setAttribute("aria-label", on ? "Wstrzymaj film" : "Odtwórz film");
      $(".play-i", playBtn).classList.toggle("hidden", on);
      $(".pause-i", playBtn).classList.toggle("hidden", !on);
      clearTimeout(timer);
      if (on) {
        // Restart paska bieżącej sceny
        const seg = segs[current];
        seg.classList.remove("is-active"); void seg.offsetWidth; seg.classList.add("is-active");
        timer = setTimeout(() => show((current + 1) % SCENES.length), SCENE_MS);
      }
    };
    playBtn.addEventListener("click", () => setPlaying(!playing));
    segWrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-seg]");
      if (!b) return;
      const i = Number(b.dataset.seg);
      current = -1;
      show(i);
      if (playing) setPlaying(true);
    });

    // Synchronizacja z przewijaniem (gdy film nie jest odtwarzany)
    if ("IntersectionObserver" in window) {
      const stepIO = new IntersectionObserver((entries) => {
        if (playing) return;
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) show(Number(vis.target.dataset.step));
      }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] });
      steps.forEach((s) => stepIO.observe(s));
    }

    // Timecode + pauza, gdy scena jest poza ekranem
    const tc = $("#cinema-timecode");
    let visible = false, tcStart = performance.now(), tcRaf = 0;
    const tick = (t) => {
      const ms = t - tcStart;
      const f = Math.floor((ms / 1000) * 24) % 24;
      const s = Math.floor(ms / 1000);
      tc.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, f].map((n) => String(n).padStart(2, "0")).join(":");
      if (visible) tcRaf = requestAnimationFrame(tick);
    };
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      stage.classList.toggle("is-paused", !visible);
      if (visible) { tcRaf = requestAnimationFrame(tick); }
      else { cancelAnimationFrame(tcRaf); if (playing) setPlaying(false); }
    }, { threshold: 0.2 }).observe(stage);

    if (reducedMotion) stage.classList.add("is-paused");
    show(0);
  }

  /* ==========================================================================
     2. KALKULATOR SIŁY TRZYMANIA
     ========================================================================== */
  // Efektywna średnica czynna przyssawek z oferty (mm). Owal 20×60 → średnica
  // koła o tym samym polu.
  const CUP_D = {
    "ev-wafer-20": 20, "ev-food-30": 30, "ev-bellow-25": 32, "ev-oval-2060": 37.7,
    "ev-flat-40": 40, "ev-heat-50": 50, "ev-foam-60": 60,
  };
  EVERSON.cupDiameters = CUP_D;
  const G = 9.81;
  const form = $("#calc-form");
  if (form) {
    const nf = (v, d = 0) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
    const mass = $("#calc-mass"), acc = $("#calc-acc");
    const setFill = (r) => r.style.setProperty("--fill", `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
    const animateNumber = (el, to, d = 0) => {
      const from = Number(el.dataset.v || 0);
      el.dataset.v = to;
      if (reducedMotion) { el.textContent = nf(to, d); return; }
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 600);
        el.textContent = nf(from + (to - from) * (1 - Math.pow(1 - k, 3)), d);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    let last = null;
    const calc = () => {
      const m = Number(mass.value), a = Number(acc.value);
      const kase = Number(form.elements.case.value);
      const n = Number(form.elements.cups.value);
      const S = Number(form.elements.safety.value);
      const dp = Number($("#calc-vac").value);       // bar
      const mu = Number($("#calc-mu").value);
      $("#out-mass").textContent = `${nf(m, m < 10 ? 1 : 0)} kg`;
      $("#out-acc").textContent = `${nf(a, 1)} m/s²`;
      setFill(mass); setFill(acc);

      const F = kase === 1 ? m * (G + a) * S : kase === 2 ? m * (G + a / mu) * S : (m / mu) * (G + a) * S;
      const perCup = F / n;
      const p = dp * 0.1;                               // N/mm²
      const dMin = Math.sqrt((4 * perCup) / (Math.PI * p));
      last = { m, a, kase, n, S, dp, mu, F, perCup, dMin };

      animateNumber($("#calc-total"), F);
      animateNumber($("#calc-per"), perCup, 1);
      animateNumber($("#calc-d"), dMin, 1);
      $("#calc-kg").textContent = nf(F / G, 1);

      const fits = Object.entries(CUP_D)
        .map(([id, d]) => ({ p: getProduct(id), d, force: (p * Math.PI * d * d) / 4 }))
        .filter((x) => x.d >= dMin)
        .sort((x, y) => x.d - y.d)
        .slice(0, 3);

      // Wykorzystanie najlepiej dopasowanej przyssawki (pierścień)
      const arc = $("#calc-arc");
      const util = fits.length ? Math.min(1, perCup / fits[0].force) : 1;
      arc.style.strokeDashoffset = String(314.16 * (1 - util));
      arc.style.stroke = fits.length ? "#d99b6c" : "#f87171";

      $("#calc-recs").innerHTML = fits.length
        ? fits.map((x) => `
          <button type="button" data-calc-rec="${x.p.id}" class="group flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-950/40 p-2.5 text-left transition hover:border-copper-300/40">
            <span class="studio relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl"><span class="absolute inset-1.5 block">${renderVisual(x.p)}</span></span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-serif text-[15px] text-bone-50">${escapeHtml(x.p.name)}</span>
              <span class="block text-[11px] text-bone-400">Siła teoretyczna ${nf(x.force, 0)} N · zapas ×${nf(x.force / perCup, 1)}</span>
            </span>
            <span class="text-xs text-bone-100">${formatPrice(x.p.price)}</span>
          </button>`).join("")
        : `<p class="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">Żadna przyssawka z katalogu online nie przeniesie tej siły przy wybranych ustawieniach. Zwiększ liczbę przyssawek lub podciśnienie — albo poproś inżyniera Everson o dobór większych średnic.</p>`;
    };

    form.addEventListener("input", calc);
    form.addEventListener("change", calc);
    $("#calc-recs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-calc-rec]");
      if (b) openQuickView(b.dataset.calcRec);
    });
    $("#calc-ask").addEventListener("click", () => {
      if (!last) return;
      const cases = { 1: "podnoszenie poziome", 2: "ruch poziomy", 3: "chwyt pionowy" };
      EVERSON.advisor?.open(`Kalkulator: detal ${nf(last.m, 1)} kg, ${cases[last.kase]}, ${last.n} przyssawki, wymagana średnica min. ${nf(last.dMin, 0)} mm. Pomożesz dobrać model?`);
    });
    calc();
  }

  /* ==========================================================================
     3. Paralaksa produktu w hero
     ========================================================================== */
  const hero = $("#top"), heroProduct = $("#hero-product");
  if (hero && heroProduct && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    let raf = 0;
    hero.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        heroProduct.style.translate = `${x * 24}px ${y * 18}px`;
        heroProduct.style.rotate = `${x * 4}deg`;
      });
    });
    hero.addEventListener("pointerleave", () => { heroProduct.style.translate = ""; heroProduct.style.rotate = ""; });
    heroProduct.style.transition = "translate .8s cubic-bezier(.16,1,.3,1), rotate .8s cubic-bezier(.16,1,.3,1)";
  }
})();
