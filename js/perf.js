// "Smart" speed pass (same approach as Grok Arcade 4.2 / Ratita Rescue). Nothing here lowers visual quality:
//  - per-instance culling of the static decor (trees, buildings, crowd-props, track decor): instances that are off
//    camera AND can't throw a shadow into view, or are fully swallowed by fog, are packed out of the draw
//  - offscreen karts skip their cosmetic animation work
//  - shader warm-up while the loading screen is up, and the previous track's GPU memory is freed after the new one
//    is built (anything the new track reuses is kept, so nothing has to re-compile or re-upload)
import * as THREE from 'three';

const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _s = new THREE.Sphere(), _m = new THREE.Matrix4(), _v = new THREE.Vector3();
const LOD_FAR = 85; // metres: only decor beyond this uses its low-detail twin; everything nearer keeps full detail
export function initDecorCull(W) {
  const list = []; if (!W || !W.grp) return list;
  W.grp.traverse((o) => {
    if (!o.isInstancedMesh || o.count < 4) return;
    const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const gs = g.boundingSphere, n = o.count;
    const mats = o.instanceMatrix.array.slice(0, n * 16), cols = o.instanceColor ? o.instanceColor.array.slice(0, n * 3) : null;
    const cx = new Float32Array(n), cy = new Float32Array(n), cz = new Float32Array(n), rr = new Float32Array(n);
    o.updateMatrixWorld();
    for (let i = 0; i < n; i++) { _m.fromArray(mats, i * 16).premultiply(o.matrixWorld); _v.copy(gs.center).applyMatrix4(_m); cx[i] = _v.x; cy[i] = _v.y; cz[i] = _v.z; rr[i] = gs.radius * _m.getMaxScaleOnAxis(); }
    list.push({ o, n, mats, cols, cx, cy, cz, rr, vis: new Uint8Array(n).fill(1), shown: n, lo: o.userData.lod || null });
  });
  W.decorCull = list; return list;
}
export function decorCull(W, cam, sun, fogD) {
  const L = W && W.decorCull; if (!L || !L.length) return;
  cam.updateMatrixWorld(); _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm);
  const sx = sun.x, sz = sun.z, SH = 95, cpx = cam.position.x, cpy = cam.position.y, cpz = cam.position.z;
  const fogFar = fogD > 0 ? 2.65 / fogD : 1e9; // exp2 fog is > 99.9% opaque past this distance
  for (const e of L) {
    let changed = false, k = 0; const caster = e.o.castShadow, lo = e.lo;
    for (let i = 0; i < e.n; i++) {
      const r = e.rr[i], dx = e.cx[i] - cpx, dy = e.cy[i] - cpy, dz = e.cz[i] - cpz, dist = Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
      let v = dist < fogFar && _fr.intersectsSphere(_s.set(_v.set(e.cx[i], e.cy[i], e.cz[i]), r * 1.05));
      if (!v && caster && Math.abs(e.cx[i] - sx) < SH + r && Math.abs(e.cz[i] - sz) < SH + r) v = true; // may cast a shadow into view
      const b = v ? (lo && dist > LOD_FAR ? 2 : 1) : 0; if (e.vis[i] !== b) { e.vis[i] = b; changed = true; } if (b) k++;
    }
    if (!changed) continue;
    const ma = e.o.instanceMatrix.array, ca = e.cols && e.o.instanceColor.array; let j = 0, f = 0;
    const la = lo && lo.instanceMatrix.array, lc = lo && e.cols && lo.instanceColor.array;
    for (let i = 0; i < e.n; i++) { const b = e.vis[i]; if (b === 1) { ma.set(e.mats.subarray(i * 16, i * 16 + 16), j * 16); if (ca) ca.set(e.cols.subarray(i * 3, i * 3 + 3), j * 3); j++; }
      else if (b === 2) { la.set(e.mats.subarray(i * 16, i * 16 + 16), f * 16); if (lc) lc.set(e.cols.subarray(i * 3, i * 3 + 3), f * 3); f++; } }
    e.o.count = j; e.shown = k; e.o.instanceMatrix.needsUpdate = true; if (ca) e.o.instanceColor.needsUpdate = true;
    if (lo) { lo.count = f; lo.instanceMatrix.needsUpdate = true; if (lc) lo.instanceColor.needsUpdate = true; }
  }
}
// is this point (with radius) on screen or able to throw a shadow onto it?
export function makeVisTest(cam, sun) {
  cam.updateMatrixWorld(); _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); const fr = new THREE.Frustum().setFromProjectionMatrix(_pm), s = new THREE.Sphere();
  return (x, y, z, r) => fr.intersectsSphere(s.set(_v.set(x, y, z), r)) || (Math.abs(x - sun.x) < 95 + r && Math.abs(z - sun.z) < 95 + r);
}
export function warmShaders(renderer, scene, camera) {
  const hidden = []; scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  try { renderer.compile(scene, camera); } catch (e) {}
  for (const o of hidden) o.visible = false;
}
export function collect(roots) {
  const R = { geo: new Set(), mat: new Set(), tex: new Set() };
  for (const root of roots) if (root) root.traverse((o) => {
    if (o.geometry) R.geo.add(o.geometry);
    if (o.material) for (const m of (Array.isArray(o.material) ? o.material : [o.material])) { R.mat.add(m); for (const k in m) { const v = m[k]; if (v && v.isTexture) R.tex.add(v); } if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k].value; if (v && v.isTexture) R.tex.add(v); } }
  });
  return R;
}
// free what the old track used that the new scene doesn't use any more
export function freeUnused(old, scene) {
  const now = collect([scene]); let n = 0;
  for (const g of old.geo) if (!now.geo.has(g)) { g.dispose(); n++; }
  for (const t of old.tex) if (!now.tex.has(t) && !t.isRenderTargetTexture) { t.dispose(); n++; }
  for (const m of old.mat) if (!now.mat.has(m)) { m.dispose(); n++; }
  return n;
}
