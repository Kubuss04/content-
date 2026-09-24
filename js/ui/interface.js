import { CHAPTERS, LENGTH } from '../story.js';

// Drobne elementy interfejsu: branże, skoki do rozdziałów, pasek postępu, odczyt skanera, kopiowanie adresu.

const TONE = { sleeve: 'light', machineXray: 'dark', machineColor: 'light', braid: 'light', spectrum: 'dark' };

export function initInterface({ story, lenis, onSector }) {
  const root = document.documentElement;

  // Branże: zmieniają paletę tła w pierwszej scenie.
  const sectorButtons = [...document.querySelectorAll('[data-sector]')];
  const thumb = document.querySelector('.sector-thumb');
  for (const button of sectorButtons) {
    button.addEventListener('click', () => {
      for (const b of sectorButtons) {
        b.classList.toggle('is-active', b === button);
        b.setAttribute('aria-pressed', String(b === button));
      }
      thumb.dataset.sector = button.dataset.sector;
      thumb.querySelector('figcaption').textContent = button.textContent.trim();
      onSector?.(button.dataset.sector);
    });
  }

  // Przyciski skaczące do rozdziału (poza oknem przeglądu, które obsługuje się samo).
  for (const button of document.querySelectorAll('[data-goto]:not(.ov-card)')) {
    button.addEventListener('click', () => story.scrollToChapter(button.dataset.goto));
  }

  // Linki do kotwic przewijają płynnie.
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const target = id === 'top' ? 0 : document.getElementById(id);
      if (target === null) return;
      event.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.8 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Kopiowanie adresu e-mail (z zaznaczeniem tekstu, gdy schowek jest zablokowany).
  const copyButton = document.getElementById('copyEmail');
  const email = document.getElementById('email');
  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      copyButton.textContent = 'Skopiowano';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(email);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyButton.textContent = 'Zaznaczono, skopiuj ręcznie';
    }
    setTimeout(() => (copyButton.textContent = 'Kopiuj adres'), 2400);
  });

  const progressButtons = [...document.querySelectorAll('.progress [data-goto]')];
  const fills = progressButtons.map((b) => b.querySelector('.progress-fill'));
  const scanPct = document.getElementById('scanPct');
  const scanBar = document.getElementById('scanBar');
  let tone = '';
  let active = -1;
  let pct = -1;

  return {
    update(view, S) {
      const name = view.b && view.mix > 0.5 ? view.b : view.a;
      if (TONE[name] !== tone) {
        tone = TONE[name];
        root.dataset.tone = tone;
      }

      const t = story.timeline.time();
      let current = 0;
      CHAPTERS.forEach((chapter, i) => {
        const end = CHAPTERS[i + 1]?.at ?? LENGTH;
        const f = Math.min(1, Math.max(0, (t - chapter.at) / (end - chapter.at)));
        fills[i].style.transform = `scaleX(${f.toFixed(4)})`;
        if (t >= chapter.at - 0.35) current = i;
      });
      if (current !== active) {
        active = current;
        progressButtons.forEach((b, i) => {
          if (i === current) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        });
        root.dataset.chapter = CHAPTERS[current].id;
      }

      const p = Math.round(S.scan * 100);
      if (p !== pct) {
        pct = p;
        scanPct.textContent = `${p}%`;
        scanBar.style.transform = `scaleX(${S.scan.toFixed(4)})`;
      }
    },
  };
}
