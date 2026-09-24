import * as THREE from 'three';
import { curveFrom, tubeGeometry } from '../geometry.js';
import { createBackdrop } from '../materials.js';
import { shiftView } from '../stage.js';

// 04 · Kolory: skręcona wiązka przewodów we wszystkich kolorach palety.

// Te same kolory są opisane w sekcji „Kolory” w index.html.
export const SPECTRUM = ['#e5361b', '#ff8a1f', '#ffc21a', '#8fd13a', '#12b3a0', '#2f5bff', '#d23c8c'];

export function createSpectrumScene({ environment }) {
  const scene = new THREE.Scene();
  scene.environment = environment;
  scene.environmentIntensity = 1.2;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  const backdrop = createBackdrop({
    top: '#171a24',
    bottom: '#060709',
    blobs: [
      { color: '#5a1a3d', x: 0.2, y: 0.78, r: 0.35 },
      { color: '#172a6e', x: 0.86, y: 0.66, r: 0.4 },
      { color: '#5e240b', x: 0.64, y: 0.08, r: 0.35 },
      { color: '#0c3934', x: 0.08, y: 0.12, r: 0.3 },
    ],
  });
  scene.add(backdrop.mesh);

  // Główna oś wiązki, a wokół niej przewody skręcone jak lina.
  const axis = curveFrom([[-9, -3.7, -1.6], [-4.4, -1.85, 0.3], [-0.8, -0.35, 0.2], [2.6, 0.6, -0.6], [6, 1.9, -1.2], [9.8, 3.6, -2.2]]);
  const steps = 400;
  const frames = axis.computeFrenetFrames(steps, false);
  const group = new THREE.Group();

  SPECTRUM.forEach((color, i) => {
    const phase = (i / SPECTRUM.length) * Math.PI * 2;
    const spread = 0.46 + 0.06 * Math.sin(i * 2.1);
    const points = [];
    for (let k = 0; k <= steps; k += 4) {
      const u = k / steps;
      const angle = phase + u * Math.PI * 2 * 1.6;
      points.push(
        axis.getPointAt(u)
          .addScaledVector(frames.normals[k], Math.cos(angle) * spread)
          .addScaledVector(frames.binormals[k], Math.sin(angle) * spread),
      );
    }
    const ribbed = i % 3 === 1;
    const geometry = tubeGeometry(new THREE.CatmullRomCurve3(points), {
      radius: 0.15 + 0.015 * (i % 3),
      radial: 36,
      segments: 520,
      ribSpacing: ribbed ? 0.09 : 0,
      ribDepth: 0.12,
    });
    const material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: ribbed ? 0.45 : 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    group.add(new THREE.Mesh(geometry, material));
  });
  scene.add(group);

  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(-2, 6, 6);
  const rim = new THREE.DirectionalLight('#9fb6ff', 1.4);
  rim.position.set(4, -2, -5);
  scene.add(key, rim);

  const target = new THREE.Vector3();

  return {
    scene,
    camera,
    update({ S, time, dt, pointer, aspect, motion }) {
      const p = S.spectrum;
      const portrait = aspect < 1;
      const fit = portrait ? THREE.MathUtils.clamp(0.95 / aspect, 1, 2) : 1;
      camera.position.set(
        -1.2 + 2.2 * p + pointer.x * 0.3 * motion,
        0.2 + 0.4 * p + pointer.y * 0.2 * motion,
        6.8 * fit,
      );
      target.set(-0.4 + 2.0 * p, 0.1 + 0.4 * p, 0);
      camera.lookAt(target);
      camera.aspect = aspect;
      shiftView(camera, portrait ? 0 : 0.1);
      camera.updateProjectionMatrix();
      group.rotation.x = Math.sin(time * 0.2) * 0.06 * motion;
      group.rotation.z = Math.sin(time * 0.13) * 0.02 * motion;
      backdrop.update(time, dt, aspect, -0.03 * pointer.x * motion - 0.05 * p, 0);
    },
  };
}
