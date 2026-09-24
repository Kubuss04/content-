import * as THREE from 'three';
import { beamGeometry, curveFrom, placeBetween, roundedBoxGeometry, subCurve, tubeGeometry } from '../geometry.js';
import { createShadowTexture, createWeaveTextures } from '../textures.js';
import { createBackdrop, createXrayMaterial } from '../materials.js';
import { shiftView } from '../stage.js';

// 02 · Prześwietlenie: ramię koparki złożone z prostych brył.
// Ta sama geometria istnieje w dwóch scenach: kolorowej (PBR) i rentgenowskiej (addytywny Fresnel).
// Shader kompozycji przesuwa między nimi linię skanera.

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = THREE.MathUtils.lerp;
const v3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export function createMachineScene({ environment, anisotropy }) {
  const colorScene = new THREE.Scene();
  colorScene.environment = environment;
  colorScene.environmentIntensity = 1;
  const xrayScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);

  const weave = createWeaveTextures({ size: 256, strands: 8, fibers: 4, bump: 4, dirt: 0.5, seed: 5 });
  Object.values(weave).forEach((t) => (t.anisotropy = anisotropy));

  // Materiały „w kolorze” i ich odpowiedniki w RTG (klucz = rola elementu).
  const COLOR = {
    paint: new THREE.MeshPhysicalMaterial({ color: '#f2a007', roughness: 0.36, clearcoat: 0.7, clearcoatRoughness: 0.18 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2a2d31', roughness: 0.55, metalness: 0.5 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#eef1f4', roughness: 0.08, metalness: 1 }),
    steel: new THREE.MeshStandardMaterial({ color: '#8f979f', roughness: 0.32, metalness: 1 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.72 }),
    hose: new THREE.MeshStandardMaterial({ color: '#17181b', roughness: 0.46 }),
    sleeve: new THREE.MeshPhysicalMaterial({
      color: '#c7160c', roughness: 0.6, ...weave, sheen: 1, sheenColor: new THREE.Color('#ff6247'), sheenRoughness: 0.45,
    }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#23343d', roughness: 0.05, metalness: 0.6, clearcoat: 1 }),
  };
  const XRAY = {
    paint: createXrayMaterial({ color: '#8fcfff', core: 0.03, rim: 1, power: 2.2, intensity: 0.28 }),
    dark: createXrayMaterial({ color: '#8fcfff', core: 0.05, rim: 1, power: 2.2, intensity: 0.24 }),
    chrome: createXrayMaterial({ color: '#d2ecff', core: 0.18, rim: 1, power: 1.8, intensity: 0.36 }),
    steel: createXrayMaterial({ color: '#d2ecff', core: 0.14, rim: 1, power: 1.8, intensity: 0.3 }),
    rubber: createXrayMaterial({ color: '#7fb8e6', core: 0.04, rim: 0.8, power: 2.4, intensity: 0.2 }),
    hose: createXrayMaterial({ color: '#ff4a10', core: 0.35, rim: 1.1, power: 1.6, intensity: 0.75 }),
    sleeve: createXrayMaterial({ color: '#ff2410', core: 0.3, rim: 1.1, power: 1.6, intensity: 0.7 }),
    glass: createXrayMaterial({ color: '#8fcfff', core: 0.02, rim: 0.6, power: 3, intensity: 0.14 }),
  };

  const machine = new THREE.Group();
  const add = (geometry, role, setup) => {
    const mesh = new THREE.Mesh(geometry, COLOR[role]);
    mesh.userData.role = role;
    setup?.(mesh);
    machine.add(mesh);
    return mesh;
  };
  const box = (w, h, d, r, role, [x, y, z]) => add(roundedBoxGeometry(w, h, d, r), role, (m) => m.position.set(x, y, z));

  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 32);
  const pinGeometry = new THREE.CylinderGeometry(1, 1, 1, 28).rotateX(Math.PI / 2);
  const pin = (p, r, length, role = 'steel') => add(pinGeometry, role, (m) => {
    m.position.copy(p);
    m.scale.set(r, r, length);
  });

  // --- Nadwozie i podwozie ---
  box(3.3, 1.0, 2.3, 0.12, 'paint', [-1.25, -1.05, 0]);
  box(0.9, 0.9, 0.62, 0.08, 'paint', [0.0, -0.4, 0]);
  box(1.25, 1.35, 1.0, 0.1, 'paint', [-1.05, 0.12, 0.62]);
  box(0.04, 0.95, 0.82, 0.015, 'glass', [-0.41, 0.25, 0.62]);
  box(1.02, 0.9, 0.04, 0.015, 'glass', [-1.05, 0.22, 1.13]);
  box(1.55, 0.3, 1.2, 0.08, 'paint', [-2.0, -0.45, -0.45]);
  box(0.75, 1.15, 2.42, 0.18, 'dark', [-2.72, -0.95, 0]);
  add(cylinder, 'steel', (m) => placeBetween(m, v3(-1.7, -0.3, -0.6), v3(-1.7, 0.4, -0.6), 0.06));
  add(cylinder, 'dark', (m) => placeBetween(m, v3(-0.95, -1.72, 0), v3(-0.95, -1.52, 0), 0.85));
  box(2.3, 0.35, 1.3, 0.06, 'dark', [-0.95, -1.85, 0]);
  for (const z of [-0.82, 0.82]) {
    box(4.5, 0.78, 0.55, 0.36, 'rubber', [-0.95, -2.05, z]);
    pin(v3(-3.05, -2.05, z), 0.34, 0.6);
    pin(v3(1.15, -2.05, z), 0.34, 0.6);
  }

  // --- Wysięgnik (lekko wygięty „banan”) i ramię ---
  const boomCurve = curveFrom([[0, 0, 0], [1.0, 1.35, 0], [2.2, 2.3, 0], [3.35, 2.3, 0], [4.4, 1.6, 0]]);
  const boomHeight = (u) => 0.5 + 0.3 * Math.sin(Math.PI * Math.min(1, u * 1.1)) - 0.1 * u;
  add(beamGeometry(boomCurve, { width: () => 0.5, height: boomHeight }), 'paint');

  const stickCurve = curveFrom([[4.05, 2.6, 0], [4.4, 1.6, 0], [4.72, 0.1, 0], [4.95, -1.35, 0]]);
  const stickHeight = (u) => 0.5 - 0.14 * u;
  add(beamGeometry(stickCurve, { width: () => 0.4, height: stickHeight }), 'paint');

  // Punkt na górnej (side = 1) albo dolnej (side = -1) powierzchni belki.
  const onBeam = (curve, heightFn, u, side, extra = 0, z = 0) => {
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const n = v3(-t.y, t.x).normalize();
    return p.addScaledVector(n, side * (heightFn(u) / 2 + extra)).setZ(z);
  };

  const boomBase = v3(0, 0);
  const boomTip = v3(4.4, 1.6);
  const bucketPivot = v3(4.95, -1.35);
  for (const [p, r, len] of [[boomBase, 0.28, 0.6], [boomTip, 0.24, 0.52], [bucketPivot, 0.2, 0.46]]) {
    pin(p, r, len, 'paint');
    pin(p, r * 0.38, len + 0.16);
  }

  // --- Łyżka ---
  const bucketPoints = [[0.12, 0.02], [0.5, -0.2], [0.62, -0.72], [0.42, -1.18], [-0.06, -1.38], [-0.62, -1.24]]
    .map(([x, y]) => v3(bucketPivot.x + x, bucketPivot.y + y));
  add(beamGeometry(new THREE.CatmullRomCurve3(bucketPoints), { width: () => 1.02, height: () => 0.07, exponent: 10 }), 'paint');
  const outline = new THREE.Shape(bucketPoints.map((p) => new THREE.Vector2(p.x, p.y)));
  outline.lineTo(bucketPivot.x - 0.5, bucketPivot.y - 0.9);
  outline.lineTo(bucketPivot.x - 0.22, bucketPivot.y - 0.34);
  const sidePlate = new THREE.ExtrudeGeometry(outline, { depth: 0.05, bevelEnabled: false, curveSegments: 16 });
  for (const z of [0.5, -0.55]) add(sidePlate, 'paint', (m) => (m.position.z = z));
  const lip = bucketPoints[bucketPoints.length - 1];
  const toothDir = lip.clone().sub(bucketPoints[bucketPoints.length - 2]).normalize();
  const toothGeometry = new THREE.ConeGeometry(0.06, 0.24, 4);
  for (const z of [-0.4, -0.2, 0, 0.2, 0.4]) {
    add(toothGeometry, 'steel', (m) => {
      m.position.copy(lip).addScaledVector(toothDir, 0.1).setZ(z);
      m.quaternion.setFromUnitVectors(v3(0, 1), toothDir);
    });
  }

  // --- Siłowniki hydrauliczne ---
  const ram = (a, b, { r = 0.1, rod = 0.05, split = 0.58 } = {}) => {
    const mid = a.clone().lerp(b, split);
    add(cylinder, 'paint', (m) => placeBetween(m, a, mid, r));
    add(cylinder, 'chrome', (m) => placeBetween(m, mid.clone().lerp(a, 0.04), b, rod));
    add(cylinder, 'dark', (m) => placeBetween(m, mid.clone().lerp(a, 0.05), mid.clone().lerp(b, 0.02), r * 1.14));
    pin(a, r * 0.9, r * 2.8);
    pin(b, rod * 1.6, r * 2.8);
    return { a, b, mid, dir: b.clone().sub(a).normalize() };
  };
  for (const z of [-0.34, 0.34]) ram(v3(0.62, -0.72, z), onBeam(boomCurve, boomHeight, 0.34, -1, 0.02, z));
  const armRam = ram(onBeam(boomCurve, boomHeight, 0.47, 1, 0.14), v3(4.0, 2.74), { r: 0.11, rod: 0.055 });
  const bucketRam = ram(onBeam(stickCurve, stickHeight, 0.14, 1, 0.1), v3(5.42, -0.95), { r: 0.095, rod: 0.048 });
  for (const end of [v3(5.28, -1.38), v3(4.92, -0.98)]) {
    add(roundedBoxGeometry(1, 1, 1, 0.3), 'dark', (m) => {
      placeBetween(m, bucketRam.b, end, 1);
      m.scale.set(0.12, m.scale.y + 0.12, 0.3);
    });
    pin(end, 0.05, 0.4);
  }

  // --- Przewody: „tętnice” maszyny ---
  const hoseCurves = [];
  const hose = (points, radius = 0.042) => {
    const curve = new THREE.CatmullRomCurve3(points);
    add(tubeGeometry(curve, { radius, radial: 14, segments: Math.ceil(curve.getLength() * 40) }), 'hose');
    const endDir = curve.getTangentAt(1);
    add(cylinder, 'steel', (m) => placeBetween(m, curve.getPointAt(1).addScaledVector(endDir, -0.1), curve.getPointAt(1), radius * 1.35));
    hoseCurves.push(curve);
    return curve;
  };
  const alongBoom = (z, us, extra = 0.07) => us.map((u) => onBeam(boomCurve, boomHeight, u, 1, extra, z));

  // Obwód siłownika ramienia.
  hose([v3(0.34, -0.5, -0.16), ...alongBoom(-0.16, [0.06, 0.16, 0.28, 0.4]), armRam.a.clone().add(v3(0.2, 0.04, -0.14))]);
  hose([
    v3(0.34, -0.5, -0.055), ...alongBoom(-0.055, [0.06, 0.16, 0.28, 0.4]),
    armRam.a.clone().addScaledVector(armRam.dir, 0.35).add(v3(0, 0.17, -0.02)),
    armRam.a.clone().addScaledVector(armRam.dir, 1.2).add(v3(0, 0.15, -0.02)),
    armRam.mid.clone().add(v3(-0.08, 0.05, -0.13)),
  ]);
  // Obwód łyżki: przez przegub wysięgnika, z pętlą w czerwonej osłonie.
  const loops = [0.055, 0.16].map((z, i) => hose([
    v3(0.34, -0.5, z), ...alongBoom(z, [0.06, 0.16, 0.28, 0.4, 0.55, 0.68, 0.8]),
    v3(4.12, 2.42 + i * 0.06, z + 0.16),
    v3(4.34, 2.86 + i * 0.1, z + 0.26),
    v3(4.62, 2.8 + i * 0.08, z + 0.24),
    bucketRam.a.clone().addScaledVector(bucketRam.dir, 0.25 + i * 0.9).add(v3(0.1, 0, 0.14)),
  ]));
  for (const curve of loops) {
    add(tubeGeometry(subCurve(curve, 0.66, 0.9), { radius: 0.072, radial: 20, segments: 90, tile: 0.1 }), 'sleeve');
  }
  // Krótkie przewody do siłowników wysięgnika.
  for (const z of [-1, 1]) {
    hose([v3(0.3, -0.62, 0.18 * z), v3(0.52, -0.8, 0.26 * z), v3(0.7, -0.56, 0.46 * z)], 0.038);
  }

  colorScene.add(machine);

  // Miękki cień pod gąsienicami (tylko w wersji kolorowej).
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 5.5),
    new THREE.MeshBasicMaterial({ map: createShadowTexture(), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(-0.4, -2.44, 0);
  colorScene.add(shadow);

  // Klon geometrii z materiałami RTG.
  const xray = machine.clone(true);
  xray.traverse((o) => {
    if (o.isMesh) o.material = XRAY[o.userData.role];
  });
  xrayScene.add(xray);

  const colorBackdrop = createBackdrop({
    top: '#f3f0ea',
    bottom: '#cbc4b8',
    blobs: [
      { color: '#fffaf1', x: 0.72, y: 0.72, r: 0.45 },
      { color: '#e9dcc8', x: 0.15, y: 0.2, r: 0.35 },
      { color: '#f6e6cf', x: 0.9, y: 0.15, r: 0.3 },
      { color: '#bdb3a4', x: 0.45, y: -0.1, r: 0.35 },
    ],
  });
  const xrayBackdrop = createBackdrop({
    top: '#0b1522',
    bottom: '#04070c',
    blobs: [
      { color: '#123a5c', x: 0.68, y: 0.55, r: 0.5 },
      { color: '#0a1d33', x: 0.1, y: 0.85, r: 0.35 },
      { color: '#081626', x: 0.95, y: 0.05, r: 0.4 },
      { color: '#0d2a45', x: 0.35, y: 0.2, r: 0.3 },
    ],
    grid: 0.045,
    gridColor: '#3a8fd8',
  });
  colorScene.add(colorBackdrop.mesh);
  xrayScene.add(xrayBackdrop.mesh);

  const key = new THREE.DirectionalLight('#fff4e6', 2.6);
  key.position.set(-4, 8, 7);
  const rim = new THREE.DirectionalLight('#dfe9ff', 2);
  rim.position.set(6, 4, -6);
  const hemi = new THREE.HemisphereLight('#fff8ef', '#8a8173', 0.7);
  colorScene.add(key, rim, hemi);

  // Kotwice hotspotów.
  const anchor = (p) => {
    const o = new THREE.Object3D();
    o.position.copy(p);
    machine.add(o);
    return o;
  };
  const anchors = {
    loop: anchor(subCurve(loops[1], 0.66, 0.9).getPointAt(0.5).add(v3(0, 0.02, 0.08))),
    boom: anchor(onBeam(boomCurve, boomHeight, 0.24, 1, 0.1, 0.2)),
    bucket: anchor(bucketRam.a.clone().lerp(bucketRam.mid, 0.6).add(v3(0.06, 0, 0.12))),
  };

  const target = new THREE.Vector3();
  const loopTarget = loops[1].getPointAt(0.8);

  return {
    scene: colorScene,
    xrayScene,
    camera,
    anchors,
    hoseCount: hoseCurves.length,
    sleeveCount: loops.length,

    update({ S, time, dt, pointer, aspect, motion }) {
      const p = S.machine;
      const zoom = smooth(S.t2);
      const portrait = aspect < 1;
      const fit = portrait ? THREE.MathUtils.clamp(0.95 / aspect, 1, 2) : 1;

      const az = lerp(0.62, -0.05, p) + pointer.x * 0.06 * motion + Math.sin(time * 0.1) * 0.01 * motion;
      const el = lerp(0.16, 0.24, p) + pointer.y * 0.04 * motion;
      let dist = lerp(16.5, 14.5, p) * fit;
      target.set(portrait ? 2.4 : 1.4, -0.05, 0);
      target.lerp(loopTarget, zoom);
      dist = lerp(dist, 2.6, zoom);

      camera.position.set(
        target.x + Math.sin(az) * Math.cos(el) * dist,
        target.y + Math.sin(el) * dist,
        target.z + Math.cos(az) * Math.cos(el) * dist,
      );
      camera.lookAt(target);
      camera.aspect = aspect;
      shiftView(camera, portrait ? 0 : 0.13 * (1 - zoom));
      camera.updateProjectionMatrix();

      colorBackdrop.update(time, dt, aspect, -0.03 * pointer.x * motion, 0);
      xrayBackdrop.update(time, dt, aspect, -0.03 * pointer.x * motion - 0.08 * p, 0);
    },
  };
}
