import * as THREE from 'three';

// Hotspoty to zwykłe przyciski HTML. Co klatkę rzutujemy punkt 3D na ekran
// i przesuwamy przycisk w to miejsce, więc „przyklejają się” do modelu.

const point = new THREE.Vector3();

export function createHotspots(layer, definitions) {
  const items = definitions
    .map((d) => ({ ...d, el: layer.querySelector(`[data-hotspot="${d.id}"]`), on: false }))
    .filter((d) => d.el);

  for (const item of items) {
    item.el.addEventListener('click', () => item.el.classList.toggle('is-open'));
  }

  return {
    update(stage, S) {
      for (const item of items) {
        const { camera } = stage.views.get(item.view);
        item.anchor.getWorldPosition(point).project(camera);
        const visibility = point.z < 1 ? item.visible(S) : 0;
        const on = visibility > 0.02;
        if (on !== item.on) {
          item.on = on;
          item.el.classList.toggle('is-on', on);
          if (!on) item.el.classList.remove('is-open');
        }
        if (!on) continue;
        const x = (point.x * 0.5 + 0.5) * stage.width;
        const y = (-point.y * 0.5 + 0.5) * stage.height;
        item.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        item.el.style.opacity = visibility.toFixed(3);
        // Przy prawej krawędzi podpis przeskakuje na lewą stronę kółka.
        item.el.classList.toggle('is-left', x > stage.width * 0.62);
      }
    },
  };
}
