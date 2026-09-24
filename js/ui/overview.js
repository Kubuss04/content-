// Tryb „Przegląd”: siatka wszystkich rozdziałów z miniaturami renderowanymi na żywo.

export function createOverview({ drawThumb, onSelect, lenis }) {
  const root = document.documentElement;
  const dialog = document.getElementById('overview');
  const toggles = [...document.querySelectorAll('[data-view]')];
  const cards = [...dialog.querySelectorAll('[data-goto]')];
  const closeButton = dialog.querySelector('[data-close]');
  let open = false;
  let returnFocus = null;
  let hideTimer = 0;

  const syncToggles = () => {
    for (const button of toggles) {
      const active = (button.dataset.view === 'overview') === open;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  };

  function show() {
    if (open) return;
    open = true;
    returnFocus = document.activeElement;
    clearTimeout(hideTimer);
    if (drawThumb) {
      for (const canvas of dialog.querySelectorAll('canvas[data-thumb]')) drawThumb(canvas.dataset.thumb, canvas.getContext('2d'));
    }
    dialog.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-overview'));
    lenis?.stop();
    syncToggles();
    cards[0]?.focus({ preventScroll: true });
  }

  function hide({ restoreFocus = true } = {}) {
    if (!open) return;
    open = false;
    root.classList.remove('is-overview');
    lenis?.start();
    syncToggles();
    hideTimer = setTimeout(() => {
      if (!open) dialog.hidden = true;
    }, 450);
    if (restoreFocus) returnFocus?.focus?.({ preventScroll: true });
  }

  toggles.forEach((button) => button.addEventListener('click', () => (button.dataset.view === 'overview' ? show() : hide())));
  cards.forEach((card) => card.addEventListener('click', () => {
    hide({ restoreFocus: false });
    onSelect(card.dataset.goto);
  }));
  closeButton?.addEventListener('click', () => hide());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) hide();
  });
  document.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') hide();
    if (event.key === 'Tab') {
      // Fokus zostaje w oknie przeglądu.
      const focusable = [...dialog.querySelectorAll('button')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  return { show, hide };
}
