import * as THREE from 'three';

// Wirtualne studio fotograficzne: pudło z gradientem (ciemna podłoga, jaśniejszy sufit)
// i kilka świecących paneli jak softboxy. PMREMGenerator zamienia je w mapę odbić,
// z której korzystają wszystkie materiały PBR (lakier, chrom, guma).

const PRESETS = {
  studio: {
    floor: [0.018, 0.018, 0.02],
    ceiling: [0.22, 0.22, 0.23],
    lights: [
      { size: [6, 3], pos: [0, 4.9, 0], color: [1, 1, 1], intensity: 4 },
      { size: [0.9, 7], pos: [-4.9, 0.8, 1.8], color: [1, 0.93, 0.85], intensity: 7 },
      { size: [0.9, 7], pos: [4.9, 0.5, -1.2], color: [0.86, 0.92, 1], intensity: 5 },
      { size: [5, 1.6], pos: [0, 1.2, -4.9], color: [1, 1, 1], intensity: 2.2 },
      { size: [4, 2], pos: [0.5, 0.8, 4.9], color: [1, 1, 1], intensity: 1.4 },
    ],
  },
  neon: {
    floor: [0.006, 0.006, 0.008],
    ceiling: [0.04, 0.04, 0.05],
    lights: [
      { size: [4, 2], pos: [0, 4.9, 0.5], color: [1, 1, 1], intensity: 2.5 },
      { size: [0.9, 7], pos: [-4.9, 0.6, 1.2], color: [1, 0.25, 0.6], intensity: 7 },
      { size: [0.9, 7], pos: [4.9, 0.4, -0.8], color: [0.25, 0.75, 1], intensity: 7 },
      { size: [5, 1.4], pos: [0, 0.8, -4.9], color: [1, 0.5, 0.15], intensity: 4 },
      { size: [4, 2], pos: [0, 0.4, 4.9], color: [1, 1, 1], intensity: 1 },
    ],
  },
};

export function createEnvironment(renderer, preset = 'studio') {
  const config = PRESETS[preset];
  const scene = new THREE.Scene();

  const room = new THREE.BoxGeometry(10, 10, 10);
  const pos = room.attributes.position;
  const floor = new THREE.Color().setRGB(...config.floor);
  const ceiling = new THREE.Color().setRGB(...config.ceiling);
  const colors = [];
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.lerpColors(floor, ceiling, (pos.getY(i) + 5) / 10);
    colors.push(c.r, c.g, c.b);
  }
  room.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(room, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

  for (const light of config.lights) {
    // Kolor > 1 = światło HDR. Tak świecą „softboxy” w odbiciach.
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(...light.color).multiplyScalar(light.intensity),
      side: THREE.DoubleSide,
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(...light.size), material);
    panel.position.fromArray(light.pos);
    panel.lookAt(0, 0, 0);
    scene.add(panel);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  return texture;
}
