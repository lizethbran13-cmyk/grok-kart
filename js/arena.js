// Battle arenas: flat bowls with bumpers, ramps, orbs. Sim queries + visuals.
import * as THREE from 'three';
import { THEMES, groundMaterial, vcMaterial, roadMaterial } from './themes.js';
import { prop } from './props.js';
import { Builder, P } from './geo.js';
import { rng } from './util.js';

const PI = Math.PI;
export function makeArena(A) {
  const S = A.size, round = A.shape === 'round';
  const ar = { A, lim: S, obstacles: A.obstacles, boxes: [], spawns: [] };
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; const r = S * (i % 2 ? 0.45 : 0.72); ar.boxes.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; ar.spawns.push({ x: Math.cos(a) * S * 0.82, z: Math.sin(a) * S * 0.82, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)) }); }
  ar.edgeDist = (x, z) => round ? S - Math.hypot(x, z) : Math.min(S - Math.abs(x), S - Math.abs(z));
  ar.query = (x, z, out) => {
    out.i = 0; out.s = 0; out.lat = 0; out.tx = 0; out.tz = 1; out.cx = 0; out.cz = 0; out.bank = 0; out.slope = 0; out.y = 0; out.cy = 0;
    out.road = true; out.solid = true; out.surf = 'road'; out.branch = -1; out.wall = ar.edgeDist(x, z) < 1.2; out.curb = false;
    for (const o of A.obstacles) if ((x - o[0]) ** 2 + (z - o[1]) ** 2 < (o[2] + 1.2) ** 2) { out.wall = true; out.ob = o; }
    if (!out.wall) out.ob = null;
    return out;
  };
  ar.push = (k, q) => {
    if (q.ob) { const o = q.ob, dx = k.x - o[0], dz = k.z - o[1], d = Math.hypot(dx, dz) || 1; k.x = o[0] + dx / d * (o[2] + 1.25); k.z = o[1] + dz / d * (o[2] + 1.25); }
    else if (round) { const d = Math.hypot(k.x, k.z) || 1; k.x = k.x / d * (S - 1.25); k.z = k.z / d * (S - 1.25); }
    else { k.x = Math.max(-S + 1.25, Math.min(S - 1.25, k.x)); k.z = Math.max(-S + 1.25, Math.min(S - 1.25, k.z)); }
    k.speed *= 0.6; k.events.push('bump');
  };
  ar.bounce = (e, q) => {
    let nx, nz;
    if (q.ob) { nx = e.x - q.ob[0]; nz = e.z - q.ob[1]; } else if (round) { nx = -e.x; nz = -e.z; } else { nx = Math.abs(e.x) > Math.abs(e.z) ? -Math.sign(e.x) : 0; nz = nx ? 0 : -Math.sign(e.z); }
    const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; const vn = e.vx * nx + e.vz * nz; if (vn < 0) { e.vx -= 2 * vn * nx; e.vz -= 2 * vn * nz; }
    e.x += nx * 1.5; e.z += nz * 1.5;
  };
  ar.rampAt = (x, z, yaw) => A.ramps.some(([rx, rz, ry]) => (x - rx) ** 2 + (z - rz) ** 2 < 9);
  ar.spawnNear = (x, z) => { let b = ar.spawns[0], bd = 1e9; ar.spawns.forEach((s) => { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = s; } }); return b; };
  return ar;
}

export function buildArenaWorld(ar, scene, quality) {
  const A = ar.A, th = THEMES[A.theme], S = A.size, round = A.shape === 'round', R = rng(99);
  const grp = new THREE.Group(); scene.add(grp); const W = { grp, anim: [], th, pads: [], ramps: [] };
  // floor
  const fm = roadMaterial(th.road).clone(); fm.map = fm.map.clone(); fm.map.repeat.set(S / 6, S / 6); fm.map.needsUpdate = true; fm.normalMap = fm.normalMap.clone(); fm.normalMap.repeat.set(S / 6, S / 6); fm.normalMap.needsUpdate = true;
  if (fm.emissiveMap) { fm.emissiveMap = fm.emissiveMap.clone(); fm.emissiveMap.repeat.set(S / 6, S / 6); fm.emissiveMap.needsUpdate = true; }
  const fl = new THREE.Mesh(round ? new THREE.CircleGeometry(S + 0.5, 96) : new THREE.PlaneGeometry(S * 2 + 1, S * 2 + 1), fm); fl.rotation.x = -PI / 2; fl.receiveShadow = true; grp.add(fl);
  // walls
  const wc1 = new THREE.Color(th.wall[0]), wc2 = new THREE.Color(th.wall[1]);
  const b = new Builder();
  if (round) { for (let i = 0; i < 48; i++) { const a = i / 48 * PI * 2; b.add(P.capsule, i % 2 ? th.wall[0] : th.wall[1], Math.cos(a) * (S + 0.6), 0.7, Math.sin(a) * (S + 0.6), PI / 2, -a, 0, 1.2, (S * 2 * PI / 48) / 1.0, 1.2); } }
  else { for (let s = 0; s < 4; s++) for (let i = 0; i < 12; i++) { const t = -S + (i + 0.5) * (S * 2 / 12); const x = s < 2 ? t : (s === 2 ? -S - 0.6 : S + 0.6), z = s < 2 ? (s === 0 ? -S - 0.6 : S + 0.6) : t; b.add(P.rbox, (i + s) % 2 ? th.wall[0] : th.wall[1], x, 0.7, z, 0, s < 2 ? 0 : PI / 2, 0, S * 2 / 12, 1.4, 1.2); } }
  A.obstacles.forEach(([x, z, r], i) => { b.add(P.cyl, i ? th.wall[0] : th.wall[1], x, 1.0, z, 0, 0, 0, r, 2.0, r); b.add(P.torus, 0xffffff, x, 2.0, z, PI / 2, 0, 0, r, r, r * 0.6); });
  const wm = new THREE.Mesh(b.build(), vcMaterial(true)); wm.castShadow = wm.receiveShadow = true; grp.add(wm);
  // ramps
  A.ramps.forEach(([x, z, ry]) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.4, 0.6, 32), new THREE.MeshPhysicalMaterial({ color: 0x19c3ff, emissive: 0x0a4a80, roughness: 0.3, clearcoat: 0.8 })); g.position.set(x, 0.3, z); g.castShadow = g.receiveShadow = true; grp.add(g); });
  // stands of decor outside
  const ring = (n, r0, r1) => { const o = []; for (let i = 0; i < n; i++) { const a = R() * PI * 2, r = S + r0 + R() * (r1 - r0); o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; };
  const im = (name, pts, sc, c) => { const g = prop(name); const m = new THREE.InstancedMesh(g, vcMaterial(false), pts.length); const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); pts.forEach((p, i) => { e.set(0, R() * 6, 0); q.setFromEuler(e); const s = sc[0] + R() * (sc[1] - sc[0]); mt.compose(new THREE.Vector3(p[0], 0, p[1]), q, new THREE.Vector3(s, s * (c ? 2 + R() * 3 : 1), s)); m.setMatrixAt(i, mt); if (c) m.setColorAt(i, new THREE.Color(c[(R() * c.length) | 0])); }); m.castShadow = true; m.receiveShadow = true; grp.add(m); };
  const gm = groundMaterial(th.ground); if (gm) { const g = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), gm); g.rotation.x = -PI / 2; g.position.y = -0.05; const gu = g.geometry.attributes.uv; for (let k = 0; k < gu.count; k++) gu.setXY(k, gu.getX(k) * 130, gu.getY(k) * 130); g.receiveShadow = true; grp.add(g); }
  if (A.theme === 'city') { im('building', ring(40, 20, 90), [10, 16], [0xff8fb3, 0x7fd3ff, 0xffd166, 0xa79bff, 0x7ee8a2]); im('tree', ring(50, 4, 18), [0.9, 1.3]); im('lamp', ring(16, 2, 3), [1, 1]); }
  else { im('asteroid', ring(40, 10, 120).map((p) => p), [2, 6]); im('pylon', ring(20, 2, 4), [1, 1]); const cr = new THREE.Mesh(new THREE.TorusGeometry(S + 5, 4, 16, 96), new THREE.MeshStandardMaterial({ color: 0x8b7fb8, roughness: 0.9 })); cr.rotation.x = PI / 2; cr.scale.z = 0.6; grp.add(cr); }
  return W;
}
