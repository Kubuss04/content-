import * as THREE from 'three';

export const DISSOLVE = 0;
export const SCAN = 1;

/**
 * Końcowy etap obrazu. Dostaje dwie wyrenderowane sceny (tA, tB) i miesza je:
 *  - DISSOLVE: miękkie „rozpuszczenie” po szumie + lekki zoom i aberracja na krawędzi,
 *  - SCAN: skośna linia skanera, która odsłania drugą scenę (RTG → kolor).
 * Na końcu: winieta, mapowanie tonów, konwersja do sRGB i ziarno jak z kliszy.
 */
export function createCompositeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: null },
      tB: { value: null },
      uMix: { value: 0 },
      uMode: { value: DISSOLVE },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uScanColor: { value: new THREE.Color('#ff7a1f').multiplyScalar(2.2) },
      uGrain: { value: 0.04 },
      uVignette: { value: 0.32 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tA;
      uniform sampler2D tB;
      uniform float uMix;
      uniform float uMode;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec3 uScanColor;
      uniform float uGrain;
      uniform float uVignette;
      varying vec2 vUv;

      float hash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float s = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          s += a * noise(p);
          p = p * 2.03 + 17.1;
          a *= 0.5;
        }
        return s;
      }
      // Kanały R i B lekko rozsunięte = aberracja chromatyczna jak w obiektywie.
      vec3 fetch(sampler2D t, vec2 uv, vec2 shift) {
        return vec3(texture2D(t, uv + shift).r, texture2D(t, uv).g, texture2D(t, uv - shift).b);
      }

      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / uResolution.y;
        vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
        float m = uMix;
        vec3 col;

        if (uMode < 0.5) {
          // Scena A „odjeżdża” do przodu, B dojeżdża z bliska. W połowie drogi rozmycie ruchu,
          // a szum lekko przesuwa moment przenikania, żeby nie był płaski jak w edytorze wideo.
          float n = fbm(p * 1.6 + 4.0);
          float mask = smoothstep(0.0, 1.0, clamp(m * 1.6 - 0.3 + (n - 0.5) * 0.6, 0.0, 1.0));
          float blur = sin(3.14159 * m);
          vec2 dir = uv - 0.5;
          float zoomA = 1.0 + 0.16 * m;
          float zoomB = 1.0 + 0.16 * (1.0 - m);
          vec3 a = vec3(0.0);
          vec3 b = vec3(0.0);
          for (int i = 0; i < 6; i++) {
            float s = 1.0 + float(i) * 0.012 * blur;
            a += texture2D(tA, 0.5 + dir / (zoomA * s)).rgb;
            b += texture2D(tB, 0.5 + dir / (zoomB * s)).rgb;
          }
          col = mix(a, b, mask) / 6.0;
        } else {
          float x = p.x + (uv.y - 0.5) * 0.2;
          float halfWidth = aspect * 0.5 + 0.14;
          float d = x - mix(-halfWidth, halfWidth, m);
          float mask = 1.0 - smoothstep(-0.0015, 0.0015, d);
          float band = exp(-abs(d) * 26.0);
          float jitter = (noise(vec2(uv.y * 220.0, uTime * 9.0)) - 0.5) * 0.014 * band;
          vec2 shift = vec2(band * 0.005, 0.0);
          col = mix(fetch(tA, uv + vec2(jitter, 0.0), shift), fetch(tB, uv + vec2(jitter, 0.0), shift), mask);
          float live = smoothstep(0.0, 0.03, m) * (1.0 - smoothstep(0.97, 1.0, m));
          float glow = exp(-abs(d) * 160.0) * 2.4 + exp(-abs(d) * 18.0) * 0.3 * step(0.0, d);
          col += uScanColor * glow * live;
        }

        float vig = smoothstep(1.25, 0.3, length(p * vec2(0.9, 1.15)));
        col *= mix(1.0 - uVignette, 1.0, vig);

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        gl_FragColor.rgb += (hash(gl_FragCoord.xy + fract(uTime * 7.3) * 517.0) - 0.5) * uGrain;
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
}
