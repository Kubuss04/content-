import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { Stage } from './webgl/stage.js';
import { DISSOLVE, SCAN } from './webgl/composite.js';
import { createEnvironment } from './webgl/environment.js';
import { createSleeveScene } from './webgl/scenes/sleeve.js';
import { createMachineScene } from './webgl/scenes/machine.js';
import { createBraidScene } from './webgl/scenes/braid.js';
import { createSpectrumScene } from './webgl/scenes/spectrum.js';
import { createStory } from './story.js';
import { createHotspots } from './ui/hotspots.js';
import { createOverview } from './ui/overview.js';
import { initInterface } from './ui/interface.js';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const params = new URLSearchParams(location.search);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = matchMedia('(pointer: coarse)').matches;

// Stan całej opowieści. GSAP zmienia te liczby w rytm scrolla, a sceny WebGL tylko je czytają.
const S = { sleeve: 0, t1: 0, machine: 0, scan: 0, t2: 0, braid: 0, t3: 0, spectrum: 0 };

// 1. Płynny scroll (Lenis) zsynchronizowany z ScrollTriggerem.
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// 2. WebGL: jedna scena na rozdział + wspólny etap przejść.
let stage = null;
let scenes = null;
try {
  stage = new Stage(document.getElementById('gl'), {
    lowPower: coarsePointer,
    fixedDpr: Number(params.get('dpr')) || 0,
  });
  const studio = createEnvironment(stage.renderer, 'studio');
  const neon = createEnvironment(stage.renderer, 'neon');
  const shared = { anisotropy: stage.anisotropy };
  scenes = {
    sleeve: createSleeveScene({ ...shared, environment: studio }),
    machine: createMachineScene({ ...shared, environment: studio }),
    braid: createBraidScene({ ...shared, environment: studio }),
    spectrum: createSpectrumScene({ ...shared, environment: neon }),
  };
  stage.addView('sleeve', scenes.sleeve.scene, scenes.sleeve.camera);
  stage.addView('machineXray', scenes.machine.xrayScene, scenes.machine.camera);
  stage.addView('machineColor', scenes.machine.scene, scenes.machine.camera);
  stage.addView('braid', scenes.braid.scene, scenes.braid.camera);
  stage.addView('spectrum', scenes.spectrum.scene, scenes.spectrum.camera);
  stage.resize();
} catch (error) {
  console.warn('WebGL jest niedostępny, strona działa bez sceny 3D.', error);
  stage = null;
  scenes = null;
  root.classList.add('no-webgl');
}

// Która scena (lub para scen w trakcie przejścia) jest teraz na ekranie.
function currentView() {
  if (S.t3 > 0) return { a: 'braid', b: 'spectrum', mix: S.t3, mode: DISSOLVE };
  if (S.t2 > 0) return { a: 'machineColor', b: 'braid', mix: S.t2, mode: DISSOLVE };
  if (S.scan > 0) return { a: 'machineXray', b: 'machineColor', mix: S.scan, mode: SCAN };
  if (S.t1 > 0) return { a: 'sleeve', b: 'machineXray', mix: S.t1, mode: DISSOLVE };
  return { a: 'sleeve', b: null, mix: 0, mode: DISSOLVE };
}

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
const motion = reduceMotion ? 0 : 1;
let elapsed = 0;

function updateScenes(dt) {
  if (!scenes) return;
  const frame = { S, time: elapsed, dt, pointer, aspect: stage.aspect, motion };
  for (const scene of Object.values(scenes)) scene.update(frame);
}

// 3. Oś czasu sterowana scrollem.
const story = createStory(S, { reduceMotion, lenis });

// 4. Interfejs.
const ui = initInterface({ story, lenis, onSector: (name) => scenes?.sleeve.setSector(name) });

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hotspots = scenes && createHotspots(document.getElementById('hotspots'), [
  { id: 'sleeve', view: 'sleeve', anchor: scenes.sleeve.anchors.main, visible: () => 1 - smoothstep(0.45, 0.7, S.sleeve) },
  ...['boom', 'loop', 'bucket'].map((id, i) => ({
    id,
    view: 'machineXray',
    anchor: scenes.machine.anchors[id],
    visible: () => smoothstep(0.02 + i * 0.05, 0.1 + i * 0.05, S.machine) * (1 - smoothstep(0.02, 0.2, S.t2)),
  })),
  { id: 'fitting', view: 'braid', anchor: scenes.braid.anchors.fitting, visible: () => smoothstep(0.9, 1, S.t2) * (1 - smoothstep(0.5, 0.8, S.braid)) },
]);

// Miniatury do trybu „Przegląd”: każda scena w reprezentatywnym momencie.
const THUMBS = {
  sleeve: { state: { sleeve: 0.15 }, view: { a: 'sleeve' } },
  xray: { state: { t1: 1, machine: 0.35, scan: 0.5 }, view: { a: 'machineXray', b: 'machineColor', mix: 0.5, mode: SCAN } },
  braid: { state: { t1: 1, machine: 1, scan: 1, t2: 1, braid: 0.4 }, view: { a: 'braid' } },
  spectrum: { state: { t1: 1, machine: 1, scan: 1, t2: 1, braid: 1, t3: 1, spectrum: 0.5 }, view: { a: 'spectrum' } },
};
function drawThumb(id, ctx) {
  const saved = { ...S };
  for (const key of Object.keys(S)) S[key] = 0;
  Object.assign(S, THUMBS[id].state);
  updateScenes(0);
  stage.snapshot(THUMBS[id].view, ctx);
  Object.assign(S, saved);
  updateScenes(0);
}
createOverview({ drawThumb: stage ? drawThumb : null, lenis, onSelect: (id) => story.scrollToChapter(id) });

if (!coarsePointer && !reduceMotion) {
  window.addEventListener('pointermove', (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((event.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
}

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => stage?.resize(), 120);
});

// 5. Jedna pętla animacji dla wszystkiego (ticker GSAP = requestAnimationFrame).
if (stage) stage.warmUp();
let firstFrame = true;
gsap.ticker.add((time, deltaMs) => {
  const dt = Math.min(deltaMs / 1000, 0.1);
  elapsed += dt * motion;
  const ease = 1 - Math.exp(-dt * 3);
  pointer.x += (pointer.tx - pointer.x) * ease;
  pointer.y += (pointer.ty - pointer.y) * ease;

  const view = currentView();
  if (stage) {
    updateScenes(dt);
    stage.frame(view, elapsed);
    stage.adapt(dt);
    hotspots.update(stage, S);
  }
  ui.update(view, S);

  if (firstFrame) {
    firstFrame = false;
    root.classList.add('is-ready');
  }
});
