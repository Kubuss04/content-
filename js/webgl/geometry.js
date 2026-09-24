import * as THREE from 'three';

// Pomocnicze bryły budowane w kodzie. Dzięki nim scena nie potrzebuje żadnych plików 3D.

/**
 * Rura (wąż, osłona, przewód) wzdłuż krzywej 3D.
 * `ribSpacing` > 0 robi z niej rurę karbowaną (odstęp między karbami w jednostkach świata).
 * `tile` ustawia UV w „kaflach” tekstury, żeby splot miał tę samą gęstość na każdym wężu.
 */
export function tubeGeometry(curve, {
  segments = 200,
  radial = 32,
  radius = 0.1,
  ribSpacing = 0,
  ribDepth = 0.1,
  ribShape = 0.6,
  tile = 0,
} = {}) {
  const length = curve.getLength();
  const ribs = ribSpacing > 0 ? Math.max(1, Math.round(length / ribSpacing)) : 0;
  if (ribs) segments = Math.max(segments, ribs * 8);

  const frames = curve.computeFrenetFrames(segments, false);
  const radiusAt = (u) => {
    if (!ribs) return radius;
    const s = Math.abs(Math.sin(Math.PI * u * ribs));
    return radius * (1 - ribDepth + ribDepth * Math.pow(s, ribShape));
  };

  const around = tile ? Math.max(1, Math.round((Math.PI * 2 * radius) / tile)) : 1;
  const along = tile ? length / tile : 1;
  const eps = 0.5 / segments;

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const P = new THREE.Vector3();
  const d = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, P);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const T = frames.tangents[i];
    const r = radiusAt(u);
    // Pochodna promienia po długości przechyla normalne na zboczach karbów.
    const u0 = Math.max(0, u - eps);
    const u1 = Math.min(1, u + eps);
    const slope = ribs ? (radiusAt(u1) - radiusAt(u0)) / ((u1 - u0) * length) : 0;

    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      d.set(cos * N.x + sin * B.x, cos * N.y + sin * B.y, cos * N.z + sin * B.z);
      positions.push(P.x + r * d.x, P.y + r * d.y, P.z + r * d.z);
      n.copy(d).addScaledVector(T, -slope).normalize();
      normals.push(n.x, n.y, n.z);
      uvs.push(u * along, (j / radial) * around);
    }
  }

  for (let i = 1; i <= segments; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (radial + 1) * (i - 1) + (j - 1);
      const b = (radial + 1) * i + (j - 1);
      const c = (radial + 1) * i + j;
      const e = (radial + 1) * (i - 1) + j;
      indices.push(a, b, e, b, c, e);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

/**
 * Belka o przekroju zaokrąglonego prostokąta (superelipsa) wzdłuż płaskiej krzywej w XY.
 * Tak powstaje wysięgnik i ramię koparki: szerokość (oś Z) i wysokość mogą się zmieniać.
 */
export function beamGeometry(curve, {
  segments = 90,
  radial = 48,
  width = () => 0.5,
  height = () => 0.5,
  exponent = 6,
} = {}) {
  const positions = [];
  const indices = [];
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const e = 2 / exponent;
  const rings = [];

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, P);
    curve.getTangentAt(u, T);
    N.set(-T.y, T.x, 0).normalize();
    const w = width(u) / 2;
    const h = height(u) / 2;
    const ring = [];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const z = Math.sign(c) * Math.pow(Math.abs(c), e) * w;
      const y = Math.sign(s) * Math.pow(Math.abs(s), e) * h;
      ring.push([P.x + N.x * y, P.y + N.y * y, P.z + z]);
      positions.push(P.x + N.x * y, P.y + N.y * y, P.z + z);
    }
    rings.push({ ring, center: P.clone() });
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const j1 = (j + 1) % radial;
      const a = i * radial + j;
      const b = (i + 1) * radial + j;
      const c = (i + 1) * radial + j1;
      const d = i * radial + j1;
      indices.push(a, b, d, b, c, d);
    }
  }

  // Denka na obu końcach (osobne wierzchołki, żeby krawędź została ostra).
  const cap = ({ ring, center }, flip) => {
    const start = positions.length / 3;
    positions.push(center.x, center.y, center.z);
    for (const p of ring) positions.push(p[0], p[1], p[2]);
    for (let j = 0; j < radial; j++) {
      const a = start + 1 + j;
      const b = start + 1 + ((j + 1) % radial);
      if (flip) indices.push(start, a, b);
      else indices.push(start, b, a);
    }
  };
  cap(rings[0], true);
  cap(rings[rings.length - 1], false);

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Prostopadłościan z zaokrąglonymi krawędziami (ta sama sztuczka co RoundedBoxGeometry z three/addons). */
export function roundedBoxGeometry(width, height, depth, radius = 0.05, segments = 3) {
  const segs = segments * 2 + 1;
  radius = Math.min(radius, width / 2, height / 2, depth / 2);
  const geometry = new THREE.BoxGeometry(1, 1, 1, segs, segs, segs).toNonIndexed();
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const inner = new THREE.Vector3(width / 2 - radius, height / 2 - radius, depth / 2 - radius);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const half = 0.5 / segs;
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.copy(p);
    n.x -= Math.sign(n.x) * half;
    n.y -= Math.sign(n.y) * half;
    n.z -= Math.sign(n.z) * half;
    n.normalize();
    pos.setXYZ(
      i,
      inner.x * Math.sign(p.x) + n.x * radius,
      inner.y * Math.sign(p.y) + n.y * radius,
      inner.z * Math.sign(p.z) + n.z * radius,
    );
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return geometry;
}

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

/** Ustawia obiekt o wysokości 1 (wzdłuż osi Y) tak, żeby łączył punkty a i b. */
export function placeBetween(object, a, b, radius = 1) {
  tmp.subVectors(b, a);
  const length = tmp.length();
  object.position.copy(a).addScaledVector(tmp, 0.5);
  object.quaternion.setFromUnitVectors(UP, tmp.normalize());
  object.scale.set(radius, length, radius);
  return object;
}

/** Krzywa Catmull-Rom z tablicy [x, y, z]. */
export function curveFrom(points, tension = 0.5) {
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', tension);
}

/** Wycina fragment krzywej (od u0 do u1) jako nową krzywą, np. pod osłonę na części węża. */
export function subCurve(curve, u0, u1, samples = 24) {
  const pts = [];
  for (let i = 0; i <= samples; i++) pts.push(curve.getPointAt(u0 + (u1 - u0) * (i / samples)));
  return new THREE.CatmullRomCurve3(pts);
}
