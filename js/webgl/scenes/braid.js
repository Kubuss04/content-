import * as THREE from 'three';
import { curveFrom, placeBetween, roundedBoxGeometry, tubeGeometry } from '../geometry.js';
import { createWeaveTextures } from '../textures.js';
import { createBackdrop } from '../materials.js';
import { shiftView } from '../stage.js';

// 03 · Kapilara DX-12: wiązka węży w oplocie, zakucia ze stali, pomarańczowa płyta maszyny.

export function createBraidScene({ environment, anisotropy }) {
  const scene = new THREE.Scene();
  scene.environment = environment;
  scene.environmentIntensity = 1;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  const backdrop = createBackdrop({
    top: '#eef0f1',
    bottom: '#b0b6bb',
    blobs: [
      { color: '#ffffff', x: 0.7, y: 0.85, r: 0.4 },
      { color: '#d5dade', x: 0.1, y: 0.6, r: 0.35 },
      { color: '#ffd9bf', x: 0.55, y: 0.35, r: 0.3 },
      { color: '#9aa1a7', x: 0.9, y: 0.05, r: 0.35 },
    ],
  });
  scene.add(backdrop.mesh);

  const paint = new THREE.MeshPhysicalMaterial({ color: '#ff5a14', roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const steel = new THREE.MeshStandardMaterial({ color: '#cfd4d9', roughness: 0.2, metalness: 1 });
  const hexSteel = new THREE.MeshStandardMaterial({ color: '#bfc5cb', roughness: 0.26, metalness: 1, flatShading: true });
  const darkSteel = new THREE.MeshStandardMaterial({ color: '#4a5056', roughness: 0.38, metalness: 1 });
  const brushed = new THREE.MeshStandardMaterial({ color: '#b9bfc6', roughness: 0.3, metalness: 1 });
  const weave = createWeaveTextures({ size: 256, strands: 8, fibers: 7, bump: 3.2, dirt: 0.2, seed: 11 });
  Object.values(weave).forEach((t) => (t.anisotropy = anisotropy));
  const braid = new THREE.MeshPhysicalMaterial({
    color: '#2b2c30',
    roughness: 0.5,
    ...weave,
    sheen: 0.8,
    sheenColor: new THREE.Color('#9aa0a8'),
    sheenRoughness: 0.35,
  });

  const group = new THREE.Group();
  scene.add(group);

  const plate = new THREE.Mesh(roundedBoxGeometry(5.4, 8, 0.16, 0.05), paint);
  plate.position.set(0.2, 0.2, -0.62);
  plate.rotation.set(0, -0.28, 0.08);
  group.add(plate);
  const boltGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 6).rotateX(Math.PI / 2);
  for (const [x, y] of [[2.35, -2.6], [2.35, -1.4], [2.35, -0.2], [2.35, 1.0], [2.35, 2.2]]) {
    const bolt = new THREE.Mesh(boltGeometry, hexSteel);
    bolt.position.set(x, y, 0.1);
    plate.add(bolt);
  }

  const manifold = new THREE.Mesh(roundedBoxGeometry(3.6, 0.75, 0.9, 0.08), darkSteel);
  manifold.position.set(0, 3.05, 0);
  group.add(manifold);

  // Zakucie węża: profil obrotowy z karbami zaciśnięcia (LatheGeometry).
  // Profil idzie od dołu do góry, wtedy normalne wskazują na zewnątrz.
  const ferruleProfile = [
    [0, 0], [0.17, 0], [0.176, -0.02], [0.176, -0.08], [0.166, -0.1], [0.176, -0.12], [0.176, -0.2],
    [0.166, -0.22], [0.176, -0.24], [0.176, -0.32], [0.166, -0.34], [0.176, -0.36], [0.176, -0.44],
    [0.16, -0.48], [0.148, -0.5], [0, -0.5],
  ].reverse().map(([r, y]) => new THREE.Vector2(r, y));
  const ferrule = new THREE.LatheGeometry(ferruleProfile, 48);
  const nut = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 6);
  const nipple = new THREE.CylinderGeometry(0.1, 0.1, 0.12, 32);

  const hoseRadius = 0.14;
  const xs = [-1.25, -0.75, -0.25, 0.25, 0.75, 1.25];
  xs.forEach((x, i) => {
    const top = 2.44;
    const n = new THREE.Mesh(nut, hexSteel);
    n.position.set(x, 2.6, 0);
    n.rotation.y = i * 0.4;
    const s = new THREE.Mesh(nipple, steel);
    s.position.set(x, 2.48, 0);
    const f = new THREE.Mesh(ferrule, steel);
    f.position.set(x, top, 0);
    group.add(n, s, f);

    const curve = curveFrom([
      [x, top - 0.45, 0],
      [x * 1.02 + 0.02 * i, 0.9, 0.05],
      [x * 1.15 + Math.sin(i * 1.7) * 0.15, -1.2, 0.25 + 0.1 * Math.cos(i)],
      [x * 1.35 + Math.sin(i * 2.3) * 0.3, -3.6, 0.5],
      [x * 1.5 + Math.sin(i) * 0.4, -6.5, 0.7],
    ]);
    group.add(new THREE.Mesh(tubeGeometry(curve, { radius: hoseRadius, radial: 48, segments: 260, tile: 0.2 }), braid));
  });

  // Duży siłownik po lewej stronie kadru.
  const ramA = new THREE.Vector3(-3.3, -4.6, 0.9);
  const ramB = new THREE.Vector3(-2.0, 5.2, -0.4);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 64);
  group.add(placeBetween(new THREE.Mesh(cylinder, brushed), ramA, ramB, 0.55));
  for (const t of [0.34, 0.37, 0.72]) {
    const a = ramA.clone().lerp(ramB, t);
    const b = ramA.clone().lerp(ramB, t + 0.012);
    group.add(placeBetween(new THREE.Mesh(cylinder, darkSteel), a, b, 0.575));
  }

  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(-5, 6, 6);
  const rim = new THREE.DirectionalLight('#ffe0cc', 2);
  rim.position.set(5, 2, -3);
  const hemi = new THREE.HemisphereLight('#ffffff', '#6d7176', 0.6);
  scene.add(key, rim, hemi);

  const anchor = new THREE.Object3D();
  anchor.position.set(0.25, 2.18, 0.2);
  group.add(anchor);

  const target = new THREE.Vector3();

  return {
    scene,
    camera,
    anchors: { fitting: anchor },

    update({ S, time, dt, pointer, aspect, motion }) {
      const p = S.braid;
      const portrait = aspect < 1;
      const fit = portrait ? THREE.MathUtils.clamp(0.9 / aspect, 1, 1.9) : 1;
      camera.position.set(
        (1.3 - 0.3 * p + pointer.x * 0.25 * motion) * fit,
        -1.6 + 1.3 * p + pointer.y * 0.2 * motion,
        (6.4 - 0.9 * p) * fit,
      );
      target.set(0, 1.2 + 1.0 * p, 0);
      camera.lookAt(target);
      camera.rotateZ(-0.1 + Math.sin(time * 0.15) * 0.005 * motion);
      camera.aspect = aspect;
      shiftView(camera, portrait ? 0 : -0.06);
      camera.updateProjectionMatrix();
      backdrop.update(time, dt, aspect, -0.02 * pointer.x * motion, -0.04 * p);
    },
  };
}
