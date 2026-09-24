import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Choreografia całej strony w jednym miejscu.
// Oś czasu ma LENGTH jednostek, a 1 jednostka = jedna wysokość ekranu przewijania.
// ScrollTrigger „przewija” tę oś razem ze scrollem (scrub), więc każde przejście działa też wstecz.

export const LENGTH = 7;

export const CHAPTERS = [
  { id: 'sleeve', at: 0 },
  { id: 'xray', at: 1.75 },
  { id: 'braid', at: 4.35 },
  { id: 'spectrum', at: 6.05 },
];

export function createStory(S, { reduceMotion, lenis }) {
  gsap.set(['#ch-xray', '#ch-braid', '#ch-spectrum'], { autoAlpha: 0 });

  const out = { autoAlpha: 0, y: -24, duration: 0.3, stagger: 0.05, ease: 'power1.in' };
  const inn = { autoAlpha: 0, y: 32, duration: 0.35, stagger: 0.07, ease: 'power2.out' };
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  // 01 · Aorta — kamera sunie wzdłuż osłony, nagłówek odpływa.
  tl.to(S, { sleeve: 1, duration: 1.3 }, 0)
    .to('#ch-sleeve .hero-copy', { autoAlpha: 0, y: -40, duration: 0.4, ease: 'power1.in' }, 0.35)
    .to('#ch-sleeve .reveal', { ...out }, 0.95)
    .to('#ch-sleeve', { autoAlpha: 0, duration: 0.05 }, 1.3)

  // Przejście 1 → 2: rozpuszczenie w scenę RTG.
    .to(S, { t1: 1, duration: 0.75, ease: 'power2.inOut' }, 1.0)

  // 02 · RTG — skaner odsłania kolory.
    .to('#ch-xray', { autoAlpha: 1, duration: 0.05 }, 1.4)
    .from('#ch-xray .reveal', { ...inn }, 1.4)
    .to(S, { machine: 1, duration: 2.6 }, 1.7)
    .to(S, { scan: 1, duration: 1.1, ease: 'power1.inOut' }, 2.2)
    .to('#ch-xray .reveal', { ...out }, 3.45)
    .to('#ch-xray', { autoAlpha: 0, duration: 0.05 }, 3.8)

  // Przejście 2 → 3: najazd na pętlę przewodów i wejście w zbliżenie.
    .to(S, { t2: 1, duration: 0.75, ease: 'power2.inOut' }, 3.55)

  // 03 · Kapilara — napis „rozciąga się” (oś szerokości fontu zmiennego).
    .to('#ch-braid', { autoAlpha: 1, duration: 0.05 }, 4.0)
    .from('#ch-braid .reveal', { ...inn }, 4.0)
    .fromTo('#h-braid', { '--wdth': 72 }, { '--wdth': 118, duration: 0.6, ease: 'power2.out' }, 4.0)
    .to(S, { braid: 1, duration: 1.7 }, 4.3)
    .to('#ch-braid .reveal', { ...out }, 5.3)
    .to('#ch-braid', { autoAlpha: 0, duration: 0.05 }, 5.65)

  // Przejście 3 → 4.
    .to(S, { t3: 1, duration: 0.75, ease: 'power2.inOut' }, 5.3)

  // 04 · Kolory.
    .to('#ch-spectrum', { autoAlpha: 1, duration: 0.05 }, 5.7)
    .from('#ch-spectrum .reveal', { ...inn }, 5.7)
    .to(S, { spectrum: 1, duration: 1 }, 6.0);

  tl.set({}, {}, LENGTH);

  const trigger = ScrollTrigger.create({
    trigger: '#story',
    start: 'top top',
    end: 'bottom bottom',
    scrub: reduceMotion ? true : 0.8,
    animation: tl,
  });

  function scrollToChapter(id) {
    const chapter = CHAPTERS.find((c) => c.id === id);
    if (!chapter) return;
    const y = trigger.start + (trigger.end - trigger.start) * (chapter.at / LENGTH);
    if (lenis) lenis.scrollTo(y, { duration: 1.8 });
    else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  return { timeline: tl, trigger, scrollToChapter };
}
