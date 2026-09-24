import * as THREE from 'three';
import { createCompositeMaterial, DISSOLVE } from './composite.js';
import { fullscreenTriangle } from './materials.js';

/**
 * Jeden canvas WebGL na całą stronę. Każda scena renderuje się do własnego bufora (render target),
 * a shader kompozycji łączy dwa bufory w przejście. Dzięki temu dowolne dwie sceny
 * mogą przenikać się płynnie, bez przeładowań i bez migania.
 */
export class Stage {
  constructor(canvas, { lowPower = false, fixedDpr = 0 } = {}) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0x0b0d0e, 1);
    this.renderer = renderer;

    this.fixedDpr = fixedDpr;
    this.dpr = fixedDpr || Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    this.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    // Bufory w półprecyzji (HDR): światła i blask skanera mogą przekraczać 1.0.
    const floatOK = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
    const options = {
      type: floatOK ? THREE.HalfFloatType : THREE.UnsignedByteType,
      samples: lowPower ? 2 : 4,
    };
    this.targetA = new THREE.WebGLRenderTarget(1, 1, options);
    this.targetB = new THREE.WebGLRenderTarget(1, 1, options);

    this.composite = createCompositeMaterial();
    this.post = new THREE.Scene();
    const quad = new THREE.Mesh(fullscreenTriangle(), this.composite);
    quad.frustumCulled = false;
    this.post.add(quad);
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.views = new Map();
    this.width = 1;
    this.height = 1;
    this.frameTimes = [];
    this.resize();
  }

  addView(name, scene, camera) {
    this.views.set(name, { scene, camera });
  }

  resize() {
    const canvas = this.renderer.domElement;
    this.width = canvas.clientWidth || window.innerWidth;
    this.height = canvas.clientHeight || window.innerHeight;
    // Na dużych monitorach ograniczamy liczbę pikseli (4K przy DPR 2 to ~15 mln pikseli na klatkę).
    if (!this.fixedDpr) this.dpr = Math.min(this.dpr, Math.sqrt(3.4e6 / (this.width * this.height)));
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.width, this.height, false);
    const w = Math.max(1, Math.floor(this.width * this.dpr));
    const h = Math.max(1, Math.floor(this.height * this.dpr));
    this.targetA.setSize(w, h);
    this.targetB.setSize(w, h);
    this.composite.uniforms.uResolution.value.set(w, h);
    for (const { camera } of this.views.values()) {
      camera.aspect = this.width / this.height;
      camera.updateProjectionMatrix();
    }
  }

  get aspect() {
    return this.width / this.height;
  }

  renderView(name, target) {
    const view = this.views.get(name);
    this.renderer.setRenderTarget(target);
    this.renderer.render(view.scene, view.camera);
  }

  /** view = { a, b, mix, mode }: scena A, scena B i postęp przejścia 0..1. */
  frame({ a, b = null, mix = 0, mode = DISSOLVE }, time) {
    const u = this.composite.uniforms;
    if (!b || mix <= 0.0005 || mix >= 0.9995) {
      this.renderView(b && mix >= 0.9995 ? b : a, this.targetA);
      u.tA.value = u.tB.value = this.targetA.texture;
      u.uMix.value = 0;
    } else {
      this.renderView(a, this.targetA);
      this.renderView(b, this.targetB);
      u.tA.value = this.targetA.texture;
      u.tB.value = this.targetB.texture;
      u.uMix.value = mix;
    }
    u.uMode.value = mode;
    u.uTime.value = time;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.post, this.postCamera);
  }

  /** Kompiluje shadery wszystkich scen z góry, żeby scroll nie przycinał przy pierwszym wejściu. */
  warmUp() {
    for (const name of this.views.keys()) this.renderView(name, this.targetA);
    this.renderer.setRenderTarget(null);
  }

  /** Miniatura: renderuje widok i kopiuje obraz z canvasu (w tym samym zadaniu, więc bufor jest jeszcze pełny). */
  snapshot(view, ctx) {
    this.frame(view, 0);
    const src = this.renderer.domElement;
    const { width: tw, height: th } = ctx.canvas;
    const scale = Math.max(tw / src.width, th / src.height);
    const sw = tw / scale;
    const sh = th / scale;
    ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, tw, th);
  }

  /** Jeśli karta graficzna nie nadąża (średnio < 40 kl./s), zmniejszamy rozdzielczość renderu. */
  adapt(dt) {
    if (this.fixedDpr || this.dpr <= 1) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((s, t) => s + t, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 1 / 40) {
      this.dpr = Math.max(1, this.dpr - 0.25);
      this.resize();
    }
  }
}

/** Przesuwa obraz kamery w poziomie (jak przesuw obiektywu), nie zmieniając perspektywy. */
export function shiftView(camera, fraction) {
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  camera.filmOffset = -fraction * camera.aspect * 2 * tanHalf * camera.getFilmWidth();
}
