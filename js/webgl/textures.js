import * as THREE from 'three';

// Tekstury liczone w przeglądarce. Zamiast ściągać zdjęcia splotu, generujemy mapę wysokości,
// a z niej mapę normalnych (światło „widzi” wypukłości) i mapę chropowatości.

function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Szum na siatce zawiniętej na brzegach, więc tekstura kafelkuje się bez szwów.
function tileableNoise(cells, seed) {
  const rnd = random(seed);
  const grid = Float32Array.from({ length: cells * cells }, rnd);
  const at = (x, y) => grid[(((y % cells) + cells) % cells) * cells + (((x % cells) + cells) % cells)];
  return (u, v) => {
    const x = u * cells;
    const y = v * cells;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(x0, y0);
    const b = at(x0 + 1, y0);
    const c = at(x0, y0 + 1);
    const d = at(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

const mod4 = (n) => ((n % 4) + 4) % 4;

/**
 * Splot 2/2, jak w oplocie węża hydraulicznego albo w tekstylnej osłonie.
 * `strands` musi być wielokrotnością 4, inaczej wzór nie zepnie się na brzegach.
 */
export function createWeaveTextures({
  size = 256,
  strands = 8,
  fibers = 6,
  gap = 0.06,
  bump = 3,
  dirt = 0.25,
  seed = 7,
} = {}) {
  const heights = new Float32Array(size * size);
  const coarse = tileableNoise(16, seed);
  const fine = tileableNoise(64, seed + 1);
  const profile = (f) => {
    const t = Math.min(1, Math.max(0, (f - gap) / (1 - 2 * gap)));
    return Math.sqrt(Math.sin(Math.PI * t));
  };
  const fiber = (f) => 0.84 + 0.16 * Math.sqrt(Math.abs(Math.sin(Math.PI * f * fibers)));

  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const a = (u + v) * strands;
      const b = (u - v) * strands;
      const ia = Math.floor(a);
      const ib = Math.floor(b);
      const fa = a - ia;
      const fb = b - ib;
      // Pasmo A jest na wierzchu przez dwa skrzyżowania, potem schodzi pod spód na kolejne dwa.
      const liftA = 0.5 + 0.5 * Math.cos((Math.PI / 2) * (mod4(ia) + b - 1));
      const liftB = 0.5 + 0.5 * Math.cos((Math.PI / 2) * (a + mod4(ib) - 3));
      const hA = (0.4 + 0.6 * liftA) * profile(fa) * fiber(fa);
      const hB = (0.4 + 0.6 * liftB) * profile(fb) * fiber(fb);
      const h = Math.max(hA, hB) + (coarse(u, v) - 0.5) * dirt * 0.3 + (fine(u, v) - 0.5) * 0.05;
      heights[y * size + x] = h;
      if (h < min) min = h;
      if (h > max) max = h;
    }
  }

  const normal = new Uint8Array(size * size * 4);
  const color = new Uint8Array(size * size * 4);
  const rough = new Uint8Array(size * size * 4);
  const H = (x, y) => heights[(((y + size) % size) * size) + ((x + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // DataTexture nie jest odwracana w pionie: wiersz 0 to v = 0.
      let nx = (H(x - 1, y) - H(x + 1, y)) * bump;
      let ny = (H(x, y - 1) - H(x, y + 1)) * bump;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      normal[i] = (nx * 0.5 + 0.5) * 255;
      normal[i + 1] = (ny * 0.5 + 0.5) * 255;
      normal[i + 2] = (nz * 0.5 + 0.5) * 255;
      normal[i + 3] = 255;

      const t = (H(x, y) - min) / (max - min);
      const shade = 255 * (0.32 + 0.68 * Math.pow(t, 0.85));
      color[i] = color[i + 1] = color[i + 2] = shade;
      color[i + 3] = 255;

      rough[i] = 0;
      rough[i + 1] = 255 * (1 - 0.35 * t);
      rough[i + 2] = 0;
      rough[i + 3] = 255;
    }
  }

  const make = (data, colorSpace) => {
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = colorSpace;
    texture.needsUpdate = true;
    return texture;
  };

  return {
    map: make(color, THREE.SRGBColorSpace),
    normalMap: make(normal, THREE.NoColorSpace),
    roughnessMap: make(rough, THREE.NoColorSpace),
  };
}

/** Miękki cień pod obiektem (radialny gradient narysowany na canvasie). */
export function createShadowTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.6)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
