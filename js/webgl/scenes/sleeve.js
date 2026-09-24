import * as THREE from 'three';
import { curveFrom, tubeGeometry } from '../geometry.js';
import { createWeaveTextures } from '../textures.js';
import { createBackdrop } from '../materials.js';
import { shiftView } from '../stage.js';

// 01 · Aorta HT-230: czerwona osłona tekstylna w makro, na rozmytym tle w kolorach branży.

// Palety tła dla przycisków „Branże”. Zmiana palety płynnie przestawia kolory sceny.
export const SECTORS = {
  agri: { top: '#eef3e6', bottom: '#4d8a33', blobs: ['#dcec8f', '#9fcd68', '#fbf8e2', '#2c6526'], sky: '#f3f7ea', ground: '#3f7a2c' },
  construction: { top: '#f5ebdb', bottom: '#c3822a', blobs: ['#ffd98a', '#f0a445', '#fff4de', '#7b4a17'], sky: '#fff1dc', ground: '#8a5a1e' },
  electric: { top: '#e5f1f6', bottom: '#1d8aa8', blobs: ['#94e7f5', '#d0f7ff', '#57b5d6', '#0f5670'], sky: '#e8f7ff', ground: '#1d6f86' },
  trucks: { top: '#e9eaed', bottom: '#5c6571', blobs: ['#ffb877', '#c8d5ff', '#f4f4f4', '#2d333d'], sky: '#f1f2f5', ground: '#3b424c' },
};

const BLOBS = [
  { x: 0.16, y: 0.3, r: 0.32 },
  { x: 0.84, y: 0.22, r: 0.3 },
  { x: 0.6, y: 0.9, r: 0.42 },
  { x: 0.32, y: -0.02, r: 0.38 },
];

const smooth = (t) => t * t * (3 - 2 * t);

export function createSleeveScene({ environment, anisotropy }) {
  const scene = new THREE.Scene();
  scene.environment = environment;
  scene.environmentIntensity = 0.85;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const start = SECTORS.agri;
  const backdrop = createBackdrop({
    top: start.top,
    bottom: start.bottom,
    blobs: start.blobs.map((color, i) => ({ color, ...BLOBS[i] })),
  });
  scene.add(backdrop.mesh);

  // Łuk od dołu kadru do prawego górnego rogu.
  const curve = curveFrom([
    [-2.6, -5.4, 1.2],
    [-1.5, -2.3, 0.8],
    [-0.2, 0.15, 0.2],
    [1.6, 1.9, -0.5],
    [4.2, 3.0, -1.6],
    [7.5, 3.6, -3.0],
  ]);
  const radius = 0.44;
  const weave = createWeaveTextures({ size: 256, strands: 8, fibers: 4, bump: 4, dirt: 0.5, seed: 3 });
  Object.values(weave).forEach((t) => (t.anisotropy = anisotropy));
  const material = new THREE.MeshPhysicalMaterial({
    color: '#c7160c',
    roughness: 0.62,
    ...weave,
    normalScale: new THREE.Vector2(0.85, 0.85),
    sheen: 1,
    sheenColor: new THREE.Color('#ff6247'),
    sheenRoughness: 0.42,
  });
  const sleeve = new THREE.Mesh(
    tubeGeometry(curve, { radius, radial: 72, ribSpacing: 0.075, ribDepth: 0.05, ribShape: 0.5, tile: 0.3 }),
    material,
  );

  const group = new THREE.Group();
  group.add(sleeve);
  scene.add(group);

  // Punkt zaczepienia „hotspotu” (kółko na produkcie).
  const anchor = new THREE.Object3D();
  anchor.position.copy(curve.getPointAt(0.47)).add(new THREE.Vector3(0.12, 0.02, radius));
  group.add(anchor);

  const hemi = new THREE.HemisphereLight(start.sky, start.ground, 0.9);
  const sun = new THREE.DirectionalLight('#fff1dd', 2.4);
  sun.position.set(-3, 6, 6);
  const rim = new THREE.DirectionalLight('#ffd6c2', 1.8);
  rim.position.set(5, 3, -5);
  scene.add(hemi, sun, rim);

  const skyTarget = hemi.color.clone();
  const groundTarget = hemi.groundColor.clone();
  const target = new THREE.Vector3();

  return {
    scene,
    camera,
    anchors: { main: anchor },

    setSector(name) {
      const palette = SECTORS[name];
      if (!palette) return;
      backdrop.setPalette(palette);
      skyTarget.set(palette.sky);
      groundTarget.set(palette.ground);
    },

    update({ S, time, dt, pointer, aspect, motion }) {
      const p = S.sleeve;
      const push = smooth(S.t1);
      const portrait = aspect < 1;
      const fit = portrait ? THREE.MathUtils.clamp(0.8 / aspect, 1, 1.7) : 1;

      camera.position.set(
        -0.6 + 1.3 * p + pointer.x * 0.25 * motion,
        -0.3 + 1.0 * p + pointer.y * 0.18 * motion,
        (9.2 - 1.8 * p - 3.2 * push) * fit,
      );
      target.set(0.1 + 1.1 * p, 0.2 + 0.9 * p, 0);
      camera.lookAt(target);
      camera.aspect = aspect;
      shiftView(camera, portrait ? 0 : 0.02);
      camera.updateProjectionMatrix();

      group.rotation.z = Math.sin(time * 0.25) * 0.015 * motion;
      group.rotation.x = Math.cos(time * 0.2) * 0.02 * motion;

      const k = 1 - Math.exp(-dt * 3);
      hemi.color.lerp(skyTarget, k);
      hemi.groundColor.lerp(groundTarget, k);
      backdrop.update(time, dt, aspect, -0.02 * pointer.x * motion - 0.05 * p, -0.015 * pointer.y * motion - 0.04 * p);
    },
  };
}
