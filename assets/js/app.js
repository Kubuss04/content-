/* =========================================================
   Lakszmi Ambasada Piękna – logika strony (bez zależności)
   - i18n (PL / EN / DE) ze słowników /locales/*.json
   - interaktywny cennik: zakładki, akordeony, wyszukiwarka
   - suwaki przed/po, mapa ładowana na żądanie, nawigacja
   ========================================================= */
(() => {
  'use strict';

  // ---------- Konfiguracja ----------
  const CONFIG = {
    // Wklej link do profilu Booksy / systemu rezerwacji. Pusty = rezerwacja telefoniczna.
    bookingUrl: '',
    phoneHref: 'tel:+48533322533',
    languages: ['pl', 'en', 'de'],
    defaultLang: 'pl',
    storageKey: 'lakszmi-lang',
    htmlLang: { pl: 'pl', en: 'en', de: 'de' },
    numberLocale: { pl: 'pl-PL', en: 'en-GB', de: 'de-DE' },
    ogLocale: { pl: 'pl_PL', en: 'en_GB', de: 'de_DE' },
    mapSrc: 'https://maps.google.com/maps?q=ul.%20Pozna%C5%84ska%2025%2C%2087-100%20Toru%C5%84&z=16&output=embed'
  };

  document.documentElement.classList.add('js');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- i18n ----------
  const dictionaries = {};
  let dict = {};
  let lang = CONFIG.defaultLang;

  const lookup = (key, vars) => {
    const value = key.split('.').reduce((obj, part) => (obj == null ? undefined : obj[part]), dict);
    if (typeof value !== 'string') return undefined;
    return vars ? value.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`)) : value;
  };
  const t = (key, vars) => lookup(key, vars) ?? key;

  const loadDictionary = async (code) => {
    if (!dictionaries[code]) {
      const res = await fetch(`locales/${code}.json`);
      if (!res.ok) throw new Error(`Nie można wczytać słownika: ${code}`);
      dictionaries[code] = await res.json();
    }
    return dictionaries[code];
  };

  const readStoredLang = () => {
    try { return localStorage.getItem(CONFIG.storageKey); } catch { return null; }
  };
  const storeLang = (code) => {
    try { localStorage.setItem(CONFIG.storageKey, code); } catch { /* tryb prywatny */ }
  };

  const initialLang = () => {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    const candidates = [fromUrl, readStoredLang()];
    return candidates.find((c) => CONFIG.languages.includes(c)) || CONFIG.defaultLang;
  };

  const applyTranslations = () => {
    $$('[data-i18n]').forEach((el) => {
      const value = lookup(el.dataset.i18n);
      if (value !== undefined) el.textContent = value;
    });
    $$('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        const value = lookup(key);
        if (attr && value !== undefined) el.setAttribute(attr, value);
      });
    });

    document.documentElement.lang = CONFIG.htmlLang[lang];
    document.title = t('meta.title');
    $('meta[name="description"]')?.setAttribute('content', t('meta.description'));
    $('meta[property="og:locale"]')?.setAttribute('content', CONFIG.ogLocale[lang]);

    $$('.lang-switch [data-lang]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });
    syncNavToggleLabel();
  };

  const setLanguage = async (code, { persist = true } = {}) => {
    if (!CONFIG.languages.includes(code)) return;
    try {
      dict = await loadDictionary(code);
    } catch (err) {
      console.error(err);
      return;
    }
    lang = code;
    applyTranslations();
    Pricing.render();
    BeforeAfter.label();
    MapEmbed.label();

    if (persist) {
      storeLang(code);
      const url = new URL(location.href);
      if (code === CONFIG.defaultLang) url.searchParams.delete('lang');
      else url.searchParams.set('lang', code);
      history.replaceState(null, '', url);
    }
  };

  // ---------- Rezerwacja ----------
  const initBooking = () => {
    if (!CONFIG.bookingUrl) return;
    $$('[data-booking]').forEach((a) => {
      a.href = CONFIG.bookingUrl;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  };

  // ---------- Nawigacja ----------
  const nav = $('#main-nav');
  const navToggle = $('.nav-toggle');

  function syncNavToggleLabel() {
    if (!navToggle) return;
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-label', t(open ? 'a11y.menu_close' : 'a11y.menu_open'));
  }

  const setNavOpen = (open) => {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    syncNavToggleLabel();
  };

  const initNav = () => {
    navToggle.addEventListener('click', () => setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNavOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNavOpen(false); navToggle.focus(); }
    });

    const header = $('.site-header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!('IntersectionObserver' in window)) return;

    // podświetlanie aktywnej sekcji w menu
    const links = $$('.main-nav li a');
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.setAttribute('aria-current', String(a.hash === `#${entry.target.id}`)));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((a) => { const s = $(a.hash); if (s) spy.observe(s); });

    // mobilny przycisk rezerwacji chowa się, gdy widać CTA w hero
    const mobileBook = $('.mobile-book');
    const hero = $('.hero-cta');
    if (mobileBook && hero) {
      new IntersectionObserver(([entry]) => mobileBook.classList.toggle('is-hidden', entry.isIntersecting)).observe(hero);
    }
  };

  // ---------- Animacje wejścia ----------
  const initReveal = () => {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  };

  // ---------- Cennik ----------
  const ICONS = {
    face: '<circle cx="12" cy="10" r="6"/><path d="M9.5 9h.01M14.5 9h.01M9.5 12.5a3.5 3.5 0 0 0 5 0M6 20c1.5-1.5 3.5-2.5 6-2.5s4.5 1 6 2.5"/>',
    nails: '<path d="M8 21V9a4 4 0 0 1 8 0v12"/><path d="M10 9a2 2 0 0 1 4 0v3h-4Z"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    brush: '<path d="M14 4l6 6-8 8H6v-6Z"/><path d="M4 20l2-2"/>',
    pen: '<path d="M16 3l5 5L9 20H4v-5Z"/><path d="M13 6l5 5"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>'
  };
  const CHEVRON = '<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  // Usuwa polskie/niemieckie znaki diakrytyczne, zachowując długość (1 znak → 1 znak)
  const fold = (str) => Array.from(str.toLowerCase(), (ch) => {
    if (ch === 'ł') return 'l';
    if (ch === 'ß') return 's';
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return base.length === 1 ? base : ch;
  }).join('');

  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const highlight = (text, query) => {
    if (!query) return escapeHtml(text);
    const chars = Array.from(text);
    const folded = fold(text);
    const out = [];
    let i = 0;
    let idx;
    while ((idx = folded.indexOf(query, i)) !== -1) {
      out.push(escapeHtml(chars.slice(i, idx).join('')));
      out.push(`<mark>${escapeHtml(chars.slice(idx, idx + query.length).join(''))}</mark>`);
      i = idx + query.length;
    }
    out.push(escapeHtml(chars.slice(i).join('')));
    return out.join('');
  };

  const Pricing = {
    data: null,
    active: 'all',
    query: '',
    openCats: new Set(),
    els: {},

    async init() {
      this.els = {
        tabs: $('#pricing-tabs'),
        list: $('#pricing-list'),
        empty: $('#pricing-empty'),
        count: $('#pricing-count'),
        search: $('#pricing-search')
      };
      try {
        const res = await fetch('data/pricing.json');
        this.data = await res.json();
      } catch (err) {
        console.error('Nie można wczytać cennika', err);
        return;
      }
      this.openCats.add(this.data.categories[0].id);

      let timer;
      this.els.search.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => { this.query = fold(e.target.value.trim()); this.renderList(); }, 120);
      });

      this.els.tabs.addEventListener('click', (e) => {
        const tab = e.target.closest('[role="tab"]');
        if (tab) this.select(tab.dataset.cat);
      });
      this.els.tabs.addEventListener('keydown', (e) => {
        const tabs = $$('[role="tab"]', this.els.tabs);
        const i = tabs.indexOf(document.activeElement);
        if (i === -1) return;
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        const target = tabs[(next + tabs.length) % tabs.length];
        target.focus();
        this.select(target.dataset.cat);
      });

      this.els.list.addEventListener('toggle', (e) => {
        const cat = e.target.dataset?.cat;
        if (!cat || this.query) return;
        if (e.target.open) this.openCats.add(cat); else this.openCats.delete(cat);
      }, true);

      this.render();
    },

    select(cat) {
      this.active = cat;
      if (cat !== 'all') this.openCats.add(cat);
      $$('[role="tab"]', this.els.tabs).forEach((tab) => {
        const on = tab.dataset.cat === cat;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      this.renderList();
    },

    render() {
      if (!this.data || !dict.pricing) return;
      this.renderTabs();
      this.renderList();
    },

    renderTabs() {
      const cats = [{ id: 'all', label: t('pricing.all') }]
        .concat(this.data.categories.map((c) => ({ id: c.id, label: t(`pricing.categories.${c.id}`) })));
      this.els.tabs.innerHTML = cats.map((c) => {
        const on = c.id === this.active;
        return `<button class="tab" type="button" role="tab" id="tab-${c.id}" data-cat="${c.id}"
          aria-controls="pricing-list" aria-selected="${on}" tabindex="${on ? 0 : -1}">${escapeHtml(c.label)}</button>`;
      }).join('');
      this.els.list.setAttribute('role', 'tabpanel');
      this.els.list.setAttribute('aria-labelledby', `tab-${this.active}`);
    },

    formatPrice(item) {
      if (item.price == null) {
        return `<span class="price-value price-value--request">${escapeHtml(t('pricing.on_request'))}</span>`;
      }
      const num = new Intl.NumberFormat(CONFIG.numberLocale[lang]).format(item.price);
      return `<span class="price-value">${num}<small>${escapeHtml(t('pricing.currency'))}</small></span>`;
    },

    renderList() {
      if (!this.data || !dict.pricing) return;
      const q = this.query;
      let total = 0;

      const html = this.data.categories
        .filter((cat) => this.active === 'all' || q || cat.id === this.active)
        .map((cat) => {
          const catName = t(`pricing.categories.${cat.id}`);
          const catMatch = q && fold(catName).includes(q);
          const items = cat.items.filter((item) => {
            if (!q || catMatch) return true;
            const name = t(`pricing.items.${item.id}.name`);
            const desc = lookup(`pricing.items.${item.id}.desc`) || '';
            return fold(name).includes(q) || fold(desc).includes(q);
          });
          if (!items.length) return '';
          total += items.length;

          const open = q || this.active !== 'all' || this.openCats.has(cat.id);
          const rows = items.map((item) => {
            const name = t(`pricing.items.${item.id}.name`);
            const desc = lookup(`pricing.items.${item.id}.desc`);
            return `<li class="price-item"${item.verified === false ? ' data-verify' : ''}>
                <span class="price-name">${highlight(name, q)}</span>
                ${this.formatPrice(item)}
                ${desc ? `<p class="price-desc">${highlight(desc, q)}</p>` : ''}
              </li>`;
          }).join('');

          return `<details class="price-cat" data-cat="${cat.id}"${open ? ' open' : ''}>
              <summary>
                <span class="cat-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[cat.icon] || ''}</svg></span>
                <h3>${highlight(catName, q)}</h3>
                <span class="cat-count">${items.length}</span>
                ${CHEVRON}
              </summary>
              <ul class="price-items">${rows}</ul>
            </details>`;
        }).join('');

      this.els.list.innerHTML = html;
      this.els.list.setAttribute('aria-labelledby', `tab-${this.active}`);
      this.els.empty.hidden = total > 0;
      this.els.count.textContent = t('pricing.results', { count: total });
    }
  };

  // ---------- Przed / Po ----------
  const BeforeAfter = {
    init() {
      $$('.ba').forEach((fig) => {
        const range = $('.ba-range', fig);
        const update = () => fig.style.setProperty('--pos', `${range.value}%`);
        range.addEventListener('input', update);
        update();
      });
    },
    label() {
      $$('.ba').forEach((fig) => {
        const name = t(fig.dataset.nameKey);
        $('.ba-range', fig).setAttribute('aria-label', t('gallery.slider', { name }));
        $('.ba-img--before', fig).setAttribute('aria-label', `${t('gallery.before')}: ${name}`);
        $('.ba-img--after', fig).setAttribute('aria-label', `${t('gallery.after')}: ${name}`);
      });
    }
  };

  // ---------- Mapa (ładowana po kliknięciu) ----------
  const MapEmbed = {
    init() {
      const btn = $('.map-load');
      btn?.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = CONFIG.mapSrc;
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.allowFullscreen = true;
        iframe.title = t('contact.map_title');
        $('#map').replaceChildren(iframe);
      });
    },
    label() {
      $('#map iframe')?.setAttribute('title', t('contact.map_title'));
    }
  };

  // ---------- Start ----------
  const init = () => {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    initBooking();
    initNav();
    initReveal();
    BeforeAfter.init();
    MapEmbed.init();

    $$('.lang-switch [data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    const start = initialLang();
    Promise.all([Pricing.init(), loadDictionary(start).then((d) => { dict = d; })])
      .then(() => setLanguage(start, { persist: start !== CONFIG.defaultLang }))
      .catch(console.error);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
