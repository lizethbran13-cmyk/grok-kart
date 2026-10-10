// Geometry builder: smooth primitives baked with vertex colours, merged into single draw calls.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
export class Builder {
  constructor() { this.parts = []; }
  add(geom, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, emissive = 0) {
    let g = geom.index ? geom.toNonIndexed() : geom.clone();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz));
    g.applyMatrix4(_m);
    const c = new THREE.Color(color); const n = g.attributes.position.count; const a = new Float32Array(n * 3);
    const e = emissive ? 1 + emissive : 1; // >1 values are boosted for bloom via vertex colour
    for (let i = 0; i < n; i++) { a[i * 3] = c.r * e; a[i * 3 + 1] = c.g * e; a[i * 3 + 2] = c.b * e; }
    g.setAttribute('color', new THREE.Float32BufferAttribute(a, 3));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    this.parts.push(g); return this;
  }
  // per-vertex colour function variant (gradients/stripes)
  addFn(geom, fn, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    this.add(geom, 0xffffff, x, y, z, rx, ry, rz, sx, sy, sz);
    const g = this.parts[this.parts.length - 1], p = g.attributes.position, c = g.attributes.color, col = new THREE.Color();
    for (let i = 0; i < p.count; i++) { fn(col, p.getX(i), p.getY(i), p.getZ(i)); c.setXYZ(i, col.r, col.g, col.b); }
    return this;
  }
  build() { const g = mergeGeometries(this.parts, false); g.computeBoundingSphere(); this.parts.forEach((p) => p.dispose()); this.parts = []; return g; }
}
// shared high-poly primitives
export const P = {
  sphere: new THREE.SphereGeometry(1, 22, 14),
  sphereLo: new THREE.SphereGeometry(1, 16, 10),
  ico: smoothIco(1, 3),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 28, 1),
  cone: new THREE.ConeGeometry(1, 1, 28, 1),
  torus: new THREE.TorusGeometry(1, 0.3, 12, 32),
  capsule: new THREE.CapsuleGeometry(0.5, 1, 8, 20),
  capsuleLo: new THREE.CapsuleGeometry(0.5, 1, 2, 6),
  rbox: new RoundedBoxGeometry(1, 1, 1, 4, 0.18),
  rboxS: new RoundedBoxGeometry(1, 1, 1, 3, 0.08),
};
export function smoothIco(r, d) { let g = new THREE.IcosahedronGeometry(r, d); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g); g.computeVertexNormals(); return g; }
export function lathe(points, seg = 32) { return new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), seg); }
export function tube(pts, r, seg = 40, rs = 12) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, rs, false); }
// lumpy organic sphere (rocks, bushes, clouds)
export function blob(seed, amp = 0.18, detail = 2) {
  const g = smoothIco(1, detail); const p = g.attributes.position; let s = seed * 9301 + 49297;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const k = [rnd() * 6, rnd() * 6, rnd() * 6, 1.5 + rnd() * 2];
  for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i); const n = Math.sin(_v.x * k[3] + k[0]) * Math.sin(_v.y * k[3] + k[1]) * Math.sin(_v.z * k[3] + k[2]); _v.multiplyScalar(1 + n * amp); p.setXYZ(i, _v.x, _v.y, _v.z); }
  g.computeVertexNormals(); return g;
}
export { RoundedBoxGeometry };
