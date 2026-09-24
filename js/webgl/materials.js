import * as THREE from 'three';

// Trójkąt przykrywający cały ekran (tańszy niż prostokąt z dwóch trójkątów).
export function fullscreenTriangle() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  return geometry;
}

/**
 * Materiał „rentgen”. Krawędzie widziane pod ostrym kątem świecą mocniej (efekt Fresnela),
 * a mieszanie addytywne sumuje warstwy: im więcej materiału po drodze, tym jaśniej.
 * Dokładnie tak wygląda zdjęcie RTG w negatywie.
 */
export function createXrayMaterial({ color = '#9fd4ff', core = 0.1, rim = 1, power = 2.2, intensity = 0.3 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uCore: { value: core },
      uRim: { value: rim },
      uPower: { value: power },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uCore;
      uniform float uRim;
      uniform float uPower;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float density = uCore + uRim * pow(1.0 - facing, uPower);
        gl_FragColor = vec4(uColor * density * uIntensity, 1.0);
      }
    `,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Tło sceny: gradient + rozmyte plamy światła (bokeh), opcjonalnie siatka pomiarowa.
 * Kolory można płynnie zmieniać metodą setPalette().
 */
export function createBackdrop({ top, bottom, blobs, grid = 0, gridColor = '#7cc4ff' }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(top) },
      uBottom: { value: new THREE.Color(bottom) },
      uBlobColor: { value: blobs.map((b) => new THREE.Color(b.color)) },
      uBlob: { value: blobs.map((b) => new THREE.Vector3(b.x, b.y, b.r)) },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uShift: { value: new THREE.Vector2() },
      uGrid: { value: grid },
      uGridColor: { value: new THREE.Color(gridColor) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uBottom;
      uniform vec3 uBlobColor[4];
      uniform vec3 uBlob[4];
      uniform float uTime;
      uniform float uAspect;
      uniform vec2 uShift;
      uniform float uGrid;
      uniform vec3 uGridColor;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        vec3 col = mix(uBottom, uTop, smoothstep(-0.1, 1.05, uv.y));
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          vec3 b = uBlob[i];
          vec2 c = b.xy + uShift * (0.6 + 0.25 * fi)
                 + 0.035 * vec2(sin(uTime * 0.21 + fi * 1.7), cos(uTime * 0.17 + fi * 2.3));
          vec2 d = (uv - c) * vec2(uAspect, 1.0);
          col = mix(col, uBlobColor[i], exp(-dot(d, d) / (b.z * b.z)) * 0.9);
        }
        if (uGrid > 0.0) {
          vec2 p = (uv - 0.5) * vec2(uAspect, 1.0) * 14.0 + uShift * 10.0;
          vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
          float line = 1.0 - min(min(g.x, g.y), 1.0);
          col += uGridColor * line * uGrid;
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(fullscreenTriangle(), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.userData.xray = 'skip';

  const u = material.uniforms;
  const target = {
    top: u.uTop.value.clone(),
    bottom: u.uBottom.value.clone(),
    blobs: u.uBlobColor.value.map((c) => c.clone()),
  };

  return {
    mesh,
    uniforms: u,
    setPalette(palette) {
      target.top.set(palette.top);
      target.bottom.set(palette.bottom);
      palette.blobs.forEach((color, i) => target.blobs[i].set(color));
    },
    update(time, dt, aspect, shiftX = 0, shiftY = 0) {
      u.uTime.value = time;
      u.uAspect.value = aspect;
      u.uShift.value.set(shiftX, shiftY);
      const k = 1 - Math.exp(-dt * 3);
      u.uTop.value.lerp(target.top, k);
      u.uBottom.value.lerp(target.bottom, k);
      u.uBlobColor.value.forEach((c, i) => c.lerp(target.blobs[i], k));
    },
  };
}
