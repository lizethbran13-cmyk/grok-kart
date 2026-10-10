// Karts + drivers: smooth extruded bodies, lathe tyres, expressive characters. All original designs.
import * as THREE from 'three';
import { Builder, P, lathe, tube, blob } from './geo.js';
import { vcMaterial } from './themes.js';
import { charById } from './data.js';

const PI = Math.PI;
const bodyCache = {}, wheelCache = {}, charCache = {}, gliderCache = {};

function profile(id) {
  const s = new THREE.Shape();
  switch (id) {
    case 'bubble': s.moveTo(-1.15, 0.1); s.bezierCurveTo(-1.35, 0.7, -0.6, 0.85, -0.35, 0.55); s.lineTo(0.45, 0.5); s.bezierCurveTo(0.9, 0.75, 1.4, 0.6, 1.3, 0.1); s.bezierCurveTo(1.2, -0.05, -1.05, -0.05, -1.15, 0.1); break;
    case 'rocket': s.moveTo(-1.2, 0.05); s.lineTo(-1.25, 0.6); s.bezierCurveTo(-1.0, 0.75, -0.6, 0.6, -0.4, 0.45); s.lineTo(0.5, 0.42); s.bezierCurveTo(1.2, 0.4, 1.6, 0.25, 1.75, 0.12); s.bezierCurveTo(1.6, 0.0, 0.5, -0.02, -1.2, 0.05); break;
    case 'monster': s.moveTo(-1.1, 0.2); s.lineTo(-1.2, 0.85); s.bezierCurveTo(-0.9, 1.0, -0.6, 0.85, -0.4, 0.7); s.lineTo(0.5, 0.7); s.bezierCurveTo(0.9, 0.85, 1.25, 0.8, 1.3, 0.35); s.bezierCurveTo(1.25, 0.15, -1.0, 0.1, -1.1, 0.2); break;
    case 'wedge': s.moveTo(-1.15, 0.05); s.lineTo(-1.15, 0.72); s.lineTo(-0.5, 0.62); s.lineTo(0.4, 0.4); s.bezierCurveTo(1.0, 0.25, 1.5, 0.15, 1.6, 0.08); s.lineTo(1.5, 0.0); s.lineTo(-1.15, 0.05); break;
    case 'tub': s.moveTo(-1.1, 0.0); s.bezierCurveTo(-1.35, 0.4, -1.3, 0.85, -1.05, 0.9); s.lineTo(-0.85, 0.8); s.lineTo(0.9, 0.8); s.lineTo(1.1, 0.9); s.bezierCurveTo(1.35, 0.85, 1.35, 0.4, 1.1, 0.0); s.lineTo(-1.1, 0.0); break;
    default: s.moveTo(-1.15, 0.05); s.lineTo(-1.2, 0.62); s.bezierCurveTo(-1.0, 0.72, -0.7, 0.62, -0.45, 0.48); s.lineTo(0.45, 0.45); s.bezierCurveTo(0.95, 0.5, 1.35, 0.42, 1.45, 0.18); s.bezierCurveTo(1.4, 0.0, 0.8, -0.02, -1.15, 0.05);
  }
  return s;
}
function bodyGeo(id) {
  if (bodyCache[id]) return bodyCache[id];
  const w = id === 'monster' ? 1.5 : id === 'rocket' ? 1.2 : 1.35;
  const g = new THREE.ExtrudeGeometry(profile(id), { depth: w - 0.36, bevelEnabled: true, bevelSize: 0.17, bevelThickness: 0.18, bevelSegments: 6, curveSegments: 28, steps: 1 });
  g.translate(0, 0, -(w - 0.36) / 2); g.rotateY(-PI / 2); g.computeVertexNormals();
  // trim parts (vertex coloured): seat, bumpers, exhausts, steering column, lights
  const b = new Builder(); const dark = 0x1f2433, chrome = 0xd8dde6;
  const seatZ = id === 'rocket' ? -0.55 : -0.45, top = id === 'monster' ? 0.75 : id === 'tub' ? 0.6 : 0.5;
  b.add(P.rbox, dark, 0, top + 0.12, seatZ, 0, 0, 0, 0.85, 0.22, 0.7);
  b.add(P.rbox, dark, 0, top + 0.45, seatZ - 0.35, -0.25, 0, 0, 0.85, 0.75, 0.16);
  b.add(P.cyl, dark, 0, top + 0.28, 0.32, 0.9, 0, 0, 0.05, 0.6, 0.05);
  b.add(P.torus, dark, 0, top + 0.5, 0.18, 0.75, 0, 0, 0.24, 0.24, 0.24);
  b.add(P.capsule, chrome, 0, 0.18, id === 'rocket' ? 1.72 : 1.42, 0, 0, PI / 2, 0.35, 1.3, 0.35);
  [-0.42, 0.42].forEach((x) => { b.add(P.cyl, chrome, x, 0.62, -1.22, PI / 2 - 0.85, 0, 0, 0.1, 0.5, 0.1); b.add(P.torus, 0xff8a1f, x, 0.8, -1.38, PI / 2 - 0.85, 0, 0, 0.09, 0.09, 0.09, 0.8); });
  b.add(P.capsule, dark, 0, 0.22, -1.32, 0, 0, PI / 2, 0.3, 1.25, 0.3);
  [-0.55, 0.55].forEach((x) => b.add(P.rboxS, 0xff2d55, x, 0.42, -1.33, 0, 0, 0, 0.26, 0.12, 0.06, 1.4));
  [-0.45, 0.45].forEach((x) => b.add(P.sphere, 0xfff6c0, x, 0.38, id === 'rocket' ? 1.6 : 1.35, 0, 0, 0, 0.12, 0.12, 0.08, 1.5));
  if (id === 'rocket' || id === 'wedge') { b.add(P.rbox, dark, 0, 1.0, -1.15, 0, 0, 0, 1.6, 0.08, 0.4); [-0.6, 0.6].forEach((x) => b.add(P.rbox, dark, x, 0.8, -1.12, 0, 0, 0, 0.08, 0.4, 0.3)); }
  if (id === 'monster') { b.add(P.rbox, 0x333333, 0, 0.95, 0.1, 0, 0, 0, 1.5, 0.08, 0.08); [-0.7, 0.7].forEach((x) => b.add(P.cyl, 0xffe14d, x, 0.95, 0.1, PI / 2, 0, 0, 0.12, 0.12, 0.12, 1.4)); }
  if (id === 'tub') { b.add(P.cyl, chrome, 0.5, 1.0, -0.9, 0, 0, 0, 0.05, 0.6, 0.05); b.add(tube([[0.5, 1.3, -0.9], [0.5, 1.45, -0.7], [0.5, 1.3, -0.55]], 0.05, 10, 8), chrome); for (let i = 0; i < 6; i++) b.add(P.sphere, 0xe0f7ff, -0.6 + Math.random() * 1.2, 0.95, -0.8 + Math.random() * 1.6, 0, 0, 0, 0.12 + Math.random() * 0.1); }
  if (id === 'bubble') b.add(P.sphere, 0xbfefff, 0, 0.7, 0.75, 0, 0, 0, 0.5, 0.25, 0.3);
  // side pods + number disc
  [-0.78, 0.78].forEach((x) => b.add(P.capsule, 0xffffff, x, 0.32, -0.05, PI / 2, 0, 0, 0.36, 0.55, 0.36));
  return (bodyCache[id] = { paint: g, trim: b.build(), top, seatZ, len: id === 'rocket' ? 1.75 : 1.45 });
}
function wheelGeo(id) {
  if (wheelCache[id]) return wheelCache[id];
  const R = id === 'big' ? 0.5 : 0.38, W = id === 'slick' ? 0.42 : id === 'big' ? 0.46 : 0.34;
  const pts = []; for (let i = 0; i <= 16; i++) { const a = -PI / 2 + i / 16 * PI; pts.push([R - W * 0.35 + Math.cos(a) * W * 0.35, Math.sin(a) * W * 0.5]); }
  const tyre = lathe(pts.map((p) => [p[0], p[1]]), 40); tyre.rotateZ(PI / 2);
  const b = new Builder(); b.addFn(tyre, (c, x, y, z) => { const a = Math.atan2(z, y); c.set(id === 'big' && Math.sin(a * 14) > 0.3 ? 0x1a1a1a : 0x2a2a2e); });
  const rimC = id === 'star' ? 0xffd60a : id === 'neon' ? 0x00e5ff : id === 'big' ? 0xff3b5c : 0xe5e7eb;
  b.add(P.cyl, rimC, 0, 0, 0, 0, 0, PI / 2, R * 0.58, W * 0.7, R * 0.58, id === 'neon' ? 1.5 : 0);
  b.add(P.cyl, 0x9ca3af, 0, 0, 0, 0, 0, PI / 2, R * 0.2, W * 0.85, R * 0.2);
  const n = id === 'star' ? 5 : 6; for (let i = 0; i < n; i++) { const a = i / n * PI * 2; b.add(P.rboxS, id === 'star' ? 0xffffff : 0x6b7280, 0, Math.cos(a) * R * 0.32, Math.sin(a) * R * 0.32, a, 0, 0, W * 0.78, R * 0.42, 0.07); }
  return (wheelCache[id] = { g: b.build(), R });
}
function gliderGeo(id) {
  if (gliderCache[id]) return gliderCache[id];
  const b = new Builder();
  if (id === 'wing') { const s = new THREE.Shape(); s.moveTo(0, 0.3); s.bezierCurveTo(1.2, 0.35, 2.2, 0.1, 2.4, -0.3); s.lineTo(0, -0.25); s.lineTo(-2.4, -0.3); s.bezierCurveTo(-2.2, 0.1, -1.2, 0.35, 0, 0.3);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3, curveSegments: 20 }); g.rotateX(-PI / 2);
    b.addFn(g, (c, x) => c.set(Math.abs(x) > 1.6 ? 0xff3b5c : 0xf8fafc), 0, 1.9, -0.2); b.add(P.cyl, 0x334155, 0, 1.35, -0.3, 0, 0, 0, 0.05, 1.1, 0.05);
  } else if (id === 'kite') { const g = new THREE.OctahedronGeometry(1, 0); b.addFn(g, (c, x, y, z) => c.set(x * z > 0 ? 0xffd60a : 0x19c3ff), 0, 2.0, -0.3, 0, PI / 4, 0, 1.6, 0.12, 1.2); b.add(tube([[0, 2, -1.4], [0.3, 1.6, -2.2], [-0.2, 1.3, -3.0]], 0.04, 16, 6), 0xff4fd8); [-1, 1].forEach((x) => b.add(P.cyl, 0x334155, x * 0.5, 1.4, -0.3, 0, 0, x * 0.6, 0.02, 1.2, 0.02));
  } else if (id === 'umbrella') { b.addFn(lathe([[0, 0.8], [0.9, 0.65], [1.8, 0.2], [2.1, -0.05]], 32), (c, x, y, z) => c.set(Math.sin(Math.atan2(z, x) * 4) > 0 ? 0xb04dff : 0xffffff), 0, 1.5, -0.2); b.add(P.cyl, 0x334155, 0, 1.4, -0.2, 0, 0, 0, 0.05, 1.6, 0.05);
  } else if (id === 'leaf') { const s = new THREE.Shape(); s.moveTo(0, 2.0); s.bezierCurveTo(1.6, 1.2, 1.6, -0.8, 0, -1.6); s.bezierCurveTo(-1.6, -0.8, -1.6, 1.2, 0, 2.0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 20 }); g.rotateX(-PI / 2); g.rotateY(PI / 2);
    b.addFn(g, (c, x, y, z) => c.set(Math.abs(z) < 0.06 ? 0xd9f99d : 0x22c55e), 0, 2.0, -0.2); b.add(P.cyl, 0x854d0e, 0, 1.4, -0.3, 0, 0, 0, 0.05, 1.2, 0.05);
  } else { const g = new THREE.SphereGeometry(2.0, 40, 12, 0, PI * 2, 0, PI * 0.32); b.addFn(g, (c, x, y, z) => c.set([0xff3b5c, 0xffffff, 0x19c3ff, 0xffd60a][Math.floor((Math.atan2(z, x) + PI) / (PI / 4)) % 4]), 0, 0.6, -0.2, 0, 0, 0, 1.25, 0.8, 1);
    for (let i = 0; i < 4; i++) { const a = PI / 4 + i * PI / 2; b.add(tube([[Math.cos(a) * 0.3, 0.9, Math.sin(a) * 0.3 - 0.2], [Math.cos(a) * 1.35, 1.55, Math.sin(a) * 1.05 - 0.2]], 0.015, 4, 4), 0xffffff); } }
  return (gliderCache[id] = b.build());
}
// ---------- characters ----------
function eyes(b, y, z, sep, r, pupil = 0x111827, look = 0) {
  [-1, 1].forEach((sd) => { b.add(P.sphere, 0xffffff, sd * sep, y, z, 0, 0, 0, r, r * 1.15, r * 0.7); b.add(P.sphere, pupil, sd * sep + look, y - r * 0.05, z + r * 0.55, 0, 0, 0, r * 0.55, r * 0.65, r * 0.3); b.add(P.sphere, 0xffffff, sd * sep + r * 0.18, y + r * 0.3, z + r * 0.75, 0, 0, 0, r * 0.18); });
}
function charGeo(id) {
  if (charCache[id]) return charCache[id];
  const C = charById(id); const body = new Builder(), head = new Builder(); const c1 = C.col, c2 = C.col2;
  let hy = 1.15; // head centre above seat
  const glove = 0xffffff;
  switch (C.kind) {
    case 'robot':
      body.add(P.rbox, 0xe2e8f0, 0, 0.45, 0, 0, 0, 0, 0.8, 0.75, 0.55); body.add(P.sphere, c1, 0, 0.55, 0.26, 0, 0, 0, 0.16, 0.16, 0.06, 1.8);
      head.add(P.rbox, 0xf1f5f9, 0, 0, 0, 0, 0, 0, 0.95, 0.75, 0.8); head.add(P.rbox, c2, 0, 0.02, 0.33, 0, 0, 0, 0.78, 0.45, 0.2);
      [-0.18, 0.18].forEach((x) => head.add(P.sphere, c1, x, 0.04, 0.44, 0, 0, 0, 0.1, 0.12, 0.05, 2.2)); head.add(P.cyl, 0x94a3b8, 0, 0.5, 0, 0, 0, 0, 0.03, 0.3, 0.03); head.add(P.sphere, 0xff4fd8, 0, 0.68, 0, 0, 0, 0, 0.09, 0.09, 0.09, 1.5);
      [-0.5, 0.5].forEach((x) => head.add(P.cyl, c1, x, 0, 0, 0, 0, PI / 2, 0.14, 0.1, 0.14)); break;
    case 'turtle':
      body.add(P.sphere, 0xfef08a, 0, 0.42, 0.05, 0, 0, 0, 0.45, 0.5, 0.35);
      body.addFn(new THREE.SphereGeometry(0.62, 32, 16, 0, PI * 2, 0, PI * 0.55), (c, x, y, z) => { const h = Math.sin(x * 9) + Math.sin(y * 9 + z * 6); c.set(h > 0.6 ? 0x65a30d : 0x3f6212); }, 0, 0.3, -0.22, -1.25, 0, 0, 1, 1, 1);
      head.add(P.sphere, c1, 0, 0, 0.05, 0, 0, 0, 0.5, 0.44, 0.5); eyes(head, 0.1, 0.32, 0.17, 0.13); head.add(tube([[-0.15, -0.14, 0.45], [0, -0.19, 0.48], [0.15, -0.14, 0.45]], 0.02, 8, 4), 0x14532d);
      head.add(P.sphere, 0xff7ab6, -0.3, -0.06, 0.36, 0, 0, 0, 0.07, 0.04, 0.03); head.add(P.sphere, 0xff7ab6, 0.3, -0.06, 0.36, 0, 0, 0, 0.07, 0.04, 0.03);
      head.add(P.torus, 0xff4fd8, 0, 0.32, 0, PI / 2, 0, 0, 0.33, 0.33, 0.4); head.add(P.sphere, 0xff4fd8, 0.28, 0.4, 0.05, 0, 0, 0, 0.11); hy = 1.0; break;
    case 'chinchilla':
      body.add(blob(40, 0.05, 3), c1, 0, 0.45, 0, 0, 0, 0, 0.5, 0.52, 0.42); body.add(P.sphere, 0xf5f5f4, 0, 0.42, 0.2, 0, 0, 0, 0.32, 0.36, 0.25);
      head.add(blob(41, 0.04, 3), c1, 0, 0, 0, 0, 0, 0, 0.55, 0.5, 0.5); [-1, 1].forEach((s) => { head.add(P.sphere, c1, s * 0.38, 0.45, -0.05, 0, 0, s * 0.35, 0.28, 0.3, 0.1); head.add(P.sphere, c2, s * 0.38, 0.45, -0.0, 0, 0, s * 0.35, 0.2, 0.22, 0.06); });
      eyes(head, 0.06, 0.36, 0.2, 0.14); head.add(P.sphere, 0xff7ab6, 0, -0.1, 0.5, 0, 0, 0, 0.07, 0.05, 0.05);
      [-1, 1].forEach((s) => [0.03, -0.05].forEach((dy) => head.add(P.cyl, 0x444444, s * 0.28, -0.12 + dy, 0.45, 0, 0.2 * s, PI / 2 + dy * 3 * s, 0.006, 0.4, 0.006))); hy = 1.05; break;
    case 'dragon':
      body.add(P.capsule, c1, 0, 0.45, 0, 0, 0, 0, 0.7, 0.5, 0.6); body.add(P.sphere, c2, 0, 0.42, 0.18, 0, 0, 0, 0.3, 0.4, 0.2);
      [-1, 1].forEach((s) => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.5, 0.5, 0.75, 0.25); sh.quadraticCurveTo(0.55, 0.05, 0.6, -0.15); sh.quadraticCurveTo(0.3, -0.05, 0, 0); body.add(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 12 }), 0xff7a3d, s * 0.25, 0.7, -0.25, 0, s > 0 ? -0.5 : PI + 0.5, 0); });
      head.add(P.sphere, c1, 0, 0, 0, 0, 0, 0, 0.5, 0.45, 0.48); head.add(P.sphere, c1, 0, -0.1, 0.38, 0, 0, 0, 0.3, 0.22, 0.25); [-0.1, 0.1].forEach((x) => head.add(P.sphere, 0x7f1d1d, x, -0.05, 0.6, 0, 0, 0, 0.04));
      eyes(head, 0.14, 0.3, 0.19, 0.13); [-1, 1].forEach((s) => head.add(P.cone, c2, s * 0.22, 0.45, -0.1, -0.4, 0, -s * 0.3, 0.08, 0.3, 0.08)); hy = 1.1; break;
    case 'penguin':
      body.add(P.sphere, c1, 0, 0.45, 0, 0, 0, 0, 0.48, 0.55, 0.42); body.add(P.sphere, 0xffffff, 0, 0.42, 0.14, 0, 0, 0, 0.35, 0.45, 0.32); body.add(P.torus, 0xff3b5c, 0, 0.85, 0, PI / 2, 0, 0, 0.3, 0.3, 0.6);
      head.add(P.sphere, c1, 0, 0, 0, 0, 0, 0, 0.46, 0.44, 0.44); head.add(P.sphere, 0xffffff, 0, -0.04, 0.16, 0, 0, 0, 0.36, 0.33, 0.32); eyes(head, 0.08, 0.38, 0.14, 0.11);
      head.add(P.cone, c2, 0, -0.08, 0.52, PI / 2, 0, 0, 0.1, 0.22, 0.07); head.add(P.cyl, 0x2563eb, 0, 0.38, -0.02, -0.2, 0, 0, 0.34, 0.12, 0.34); head.add(P.sphere, 0xffffff, 0, 0.5, -0.06, 0, 0, 0, 0.1); hy = 1.05; break;
    case 'dino':
      body.add(P.capsule, c1, 0, 0.45, 0, 0, 0, 0, 0.75, 0.5, 0.62); body.add(P.sphere, c2, 0, 0.42, 0.2, 0, 0, 0, 0.32, 0.4, 0.2); for (let i = 0; i < 4; i++) body.add(P.cone, 0xff7a3d, 0, 0.95 - i * 0.18, -0.25 - i * 0.06, -0.6, 0, 0, 0.08, 0.2, 0.08);
      head.add(P.sphere, c1, 0, 0, 0, 0, 0, 0, 0.48, 0.44, 0.5); head.add(P.sphere, c1, 0, -0.08, 0.4, 0, 0, 0, 0.36, 0.26, 0.3); head.add(tube([[-0.2, -0.18, 0.62], [0, -0.22, 0.68], [0.2, -0.18, 0.62]], 0.02, 8, 4), 0x14532d);
      for (let i = -2; i <= 2; i++) head.add(P.cone, 0xffffff, i * 0.07, -0.2, 0.64, PI, 0, 0, 0.025, 0.05, 0.025); eyes(head, 0.17, 0.3, 0.2, 0.12); hy = 1.12; break;
    case 'astro':
      body.add(P.capsule, 0xf8fafc, 0, 0.45, 0, 0, 0, 0, 0.8, 0.5, 0.6); body.add(P.rbox, c2, 0, 0.5, 0.27, 0, 0, 0, 0.3, 0.25, 0.08); body.add(P.sphere, 0x22d3ee, 0.07, 0.53, 0.32, 0, 0, 0, 0.04, 0.04, 0.02, 2); body.add(P.rbox, 0xcbd5e1, 0, 0.5, -0.35, 0, 0, 0, 0.55, 0.6, 0.25);
      head.add(P.sphere, 0xfcd5b5, 0, -0.04, 0, 0, 0, 0, 0.33); eyes(head, 0.0, 0.26, 0.11, 0.08); head.add(tube([[-0.08, -0.14, 0.29], [0, -0.17, 0.31], [0.08, -0.14, 0.29]], 0.015, 8, 4), 0x7f1d1d);
      head.add(P.sphere, c2, 0, 0.16, -0.04, 0, 0, 0, 0.35, 0.22, 0.34); head.add(P.torus, 0xe2e8f0, 0, -0.38, 0, PI / 2, 0, 0, 0.4, 0.4, 0.5); hy = 1.12; break;
    case 'ghost':
      body.addFn(lathe([[0, 0.9], [0.4, 0.75], [0.5, 0.4], [0.52, 0.05], [0.5, 0.0]], 32), (c, x, y) => c.set(c1), 0, 0, 0);
      head.add(P.sphere, c1, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.46); eyes(head, 0.08, 0.32, 0.17, 0.12, 0x312e81); head.add(P.sphere, 0x4c1d95, 0, -0.17, 0.42, 0, 0, 0, 0.1, 0.08, 0.05); head.add(P.sphere, 0xff7ab6, 0, -0.22, 0.43, 0, 0, 0, 0.05, 0.04, 0.03);
      head.add(P.sphere, 0xffb3d9, -0.3, -0.07, 0.35, 0, 0, 0, 0.07, 0.04, 0.03); head.add(P.sphere, 0xffb3d9, 0.3, -0.07, 0.35, 0, 0, 0, 0.07, 0.04, 0.03); hy = 1.0; break;
    case 'bunny':
      body.add(P.sphere, c1, 0, 0.45, 0, 0, 0, 0, 0.45, 0.52, 0.4); body.add(P.sphere, 0xfff7ed, 0, 0.42, 0.18, 0, 0, 0, 0.3, 0.38, 0.22);
      head.add(P.sphere, c1, 0, 0, 0, 0, 0, 0, 0.46, 0.42, 0.44); [-1, 1].forEach((s) => { head.add(P.capsule, c1, s * 0.17, 0.62, -0.05, -0.15, 0, -s * 0.15, 0.2, 0.7, 0.12); head.add(P.capsule, c2, s * 0.17, 0.62, 0.0, -0.15, 0, -s * 0.15, 0.12, 0.55, 0.06); });
      eyes(head, 0.08, 0.32, 0.16, 0.12); head.add(P.sphere, 0xff7ab6, 0, -0.07, 0.43, 0, 0, 0, 0.06, 0.045, 0.04); head.add(P.rboxS, 0xffffff, 0, -0.2, 0.41, 0, 0, 0, 0.1, 0.08, 0.03); hy = 1.05; break;
    default: // captain
      body.add(P.capsule, c1, 0, 0.45, 0, 0, 0, 0, 0.8, 0.5, 0.6); body.add(P.sphere, c2, 0, 0.6, 0.28, 0, 0, 0, 0.13, 0.13, 0.05, 1.2);
      head.add(P.sphere, 0xfcd5b5, 0, -0.04, 0, 0, 0, 0, 0.38); eyes(head, 0.02, 0.3, 0.13, 0.09); head.add(P.sphere, 0xf0b090, 0, -0.06, 0.38, 0, 0, 0, 0.08);
      [-1, 1].forEach((s) => head.add(P.capsule, 0x78350f, s * 0.11, -0.16, 0.34, 0, 0, s * 1.2, 0.08, 0.22, 0.08));
      head.add(new THREE.SphereGeometry(0.42, 32, 16, 0, PI * 2, 0, PI * 0.55), c1, 0, 0.02, -0.02); head.add(P.rboxS, c2, 0, 0.32, 0.18, -0.6, 0, 0, 0.12, 0.12, 0.05);
      head.add(P.torus, 0x334155, -0.13, 0.18, 0.3, 0, 0, 0, 0.1, 0.1, 0.1); head.add(P.torus, 0x334155, 0.13, 0.18, 0.3, 0, 0, 0, 0.1, 0.1, 0.1); hy = 1.1;
  }
  // arms (gloves) reaching for the wheel
  const arm = new Builder(); arm.add(P.capsule, C.kind === 'astro' ? 0xf8fafc : C.kind === 'robot' ? 0xcbd5e1 : c1, 0, -0.22, 0, 0, 0, 0, 0.17, 0.32, 0.17); arm.add(P.sphere, C.kind === 'robot' ? 0x94a3b8 : C.kind === 'ghost' ? c1 : glove, 0, -0.5, 0, 0, 0, 0, 0.12);
  return (charCache[id] = { body: body.build(), head: head.build(), arm: arm.build(), hy });
}

let paintCache = {};
function paintMat(col) { return paintCache[col] || (paintCache[col] = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.25, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 })); }
const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
const flameGeo = (() => { const g = new THREE.ConeGeometry(0.16, 0.9, 16, 1, true); g.rotateX(-PI / 2); g.translate(0, 0, -0.45); return g; })();
const shieldMat = new THREE.MeshPhysicalMaterial({ color: 0x9be7ff, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, depthWrite: false, side: THREE.DoubleSide });
const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 8, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

// look = { char, body, wheels, glider, paint }
export function makeKart(look) {
  const root = new THREE.Group(); const tilt = new THREE.Group(); root.add(tilt);
  const B = bodyGeo(look.body || 'classic'); const W = wheelGeo(look.wheels || 'std');
  const paint = new THREE.Mesh(B.paint, paintMat(look.paint || '#ff3b5c')); const trim = new THREE.Mesh(B.trim, vcMaterial(true));
  paint.castShadow = trim.castShadow = true; paint.position.y = trim.position.y = 0.22;
  tilt.add(paint, trim);
  const wheels = [];
  const wz = B.len - 0.5, wx = (look.body === 'monster' ? 0.92 : 0.82), wy = W.R;
  [[-wx, wz], [wx, wz], [-wx, -0.85], [wx, -0.85]].forEach(([x, z], i) => {
    const piv = new THREE.Group(); piv.position.set(x, wy, z); const m = new THREE.Mesh(W.g, vcMaterial(false)); m.castShadow = true; if (x < 0) m.rotation.y = PI; piv.add(m); tilt.add(piv); wheels.push({ piv, m, front: i < 2 });
  });
  const C = charGeo(look.char || 'grok'); const drv = new THREE.Group(); drv.position.set(0, 0.22 + B.top + 0.12, B.seatZ + 0.05); tilt.add(drv);
  const bodyM = new THREE.Mesh(C.body, vcMaterial(false)); bodyM.castShadow = true; drv.add(bodyM);
  const headG = new THREE.Group(); headG.position.y = C.hy; const headM = new THREE.Mesh(C.head, vcMaterial(true)); headM.castShadow = true; headG.add(headM); drv.add(headG);
  if (charById(look.char).kind === 'astro') { const helm = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 20), shieldMat.clone()); helm.material.opacity = 0.22; headG.add(helm); }
  const arms = [-1, 1].map((s) => { const a = new THREE.Mesh(C.arm, vcMaterial(false)); a.position.set(s * 0.36, 0.72, 0.05); a.rotation.x = -1.1; a.rotation.z = s * 0.25; drv.add(a); return a; });
  const glider = new THREE.Mesh(gliderGeo(look.glider || 'chute'), vcMaterial(false)); glider.visible = false; glider.scale.setScalar(0.01); tilt.add(glider);
  const flames = [-0.35, 0.35].map((x) => { const f = new THREE.Mesh(flameGeo, flameMat.clone()); f.position.set(x, 0.72, -1.62); f.rotation.x = 0.25; f.visible = false; tilt.add(f); return f; });
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.9, 32, 20), shieldMat); shield.position.y = 0.9; shield.visible = false; root.add(shield);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); sh.rotation.x = -PI / 2; sh.position.y = 0.05; root.add(sh);
  const K = { root, tilt, paint, wheels, drv, headG, arms, glider, flames, shield, shadow: sh, wheelR: W.R, spin: 0, look };
  return K;
}

// per-frame animation from physics state
const rainbow = new THREE.Color();
export function animateKart(K, s, dt, t) {
  K.root.position.set(s.x, s.y, s.z);
  K.root.rotation.y = s.yaw + (s.driftVis || 0) + (s.spinVis || 0);
  const sc = s.shrink > 0 ? 0.55 : 1; K.tilt.scale.setScalar(THREE.MathUtils.lerp(K.tilt.scale.x, sc, Math.min(1, dt * 8)));
  K.tilt.rotation.x = -(s.pitch || 0) + (s.trickVis || 0) * PI * 2 * (s.trickAxis === 1 ? 1 : 0);
  K.tilt.rotation.z = (s.roll || 0) + (s.trickVis || 0) * PI * 2 * (s.trickAxis === 2 ? 1 : 0);
  K.tilt.position.y = (s.bounce || 0) + (s.tumble > 0 ? Math.sin(s.tumble * PI / 1.2) * 1.5 : 0);
  if (s.tumble > 0) K.tilt.rotation.x = -s.tumble * PI * 1.66;
  K.spin += (s.speed || 0) * dt / K.wheelR;
  K.wheels.forEach((w) => { w.m.rotation.x = K.spin; if (w.front) w.piv.rotation.y = (s.steer || 0) * 0.45; });
  K.headG.rotation.y = (s.steer || 0) * 0.35 + (s.lookBack || 0); K.headG.rotation.z = -(s.steer || 0) * 0.12; K.headG.position.y = K.headG.position.y * 0.9 + (K.headG.userData.hy0 || (K.headG.userData.hy0 = K.headG.position.y)) * 0.1 + Math.sin(t * 9 + s.x) * 0.004;
  K.drv.rotation.z = -(s.steer || 0) * 0.14 - (s.driftDir || 0) * 0.08;
  K.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * 0.25 + (s.steer || 0) * 0.3; });
  // glider
  const gl = s.glide ? 1 : 0; K.glider.visible = gl > 0 || K.glider.scale.x > 0.05;
  K.glider.scale.setScalar(THREE.MathUtils.lerp(K.glider.scale.x, gl ? 1 : 0.01, Math.min(1, dt * 6)));
  // flames
  const fl = s.boost > 0; K.flames.forEach((f, i) => { f.visible = fl; if (fl) { const k = 0.8 + Math.sin(t * 60 + i * 2) * 0.25 + (s.boostLvl || 1) * 0.25; f.scale.set(1 + (s.boostLvl || 1) * 0.15, 1 + (s.boostLvl || 1) * 0.15, k * 1.6); f.material.color.set(s.boostLvl >= 3 ? 0xd06bff : s.boostLvl === 2 ? 0xff8a1f : 0x5fd0ff).lerp(new THREE.Color(0xffffff), 0.15); } });
  K.shield.visible = !!s.shield; if (s.shield) { K.shield.rotation.y += dt * 1.5; K.shield.scale.setScalar(sc * (1 + Math.sin(t * 6) * 0.03)); }
  // super nova rainbow paint
  if (s.nova > 0) { rainbow.setHSL((t * 1.5) % 1, 1, 0.55); if (!K.novaMat) K.novaMat = K.paint.material.clone(); K.novaMat.color.copy(rainbow); K.novaMat.emissive = rainbow; K.novaMat.emissiveIntensity = 0.6; K.paint.material = K.novaMat; }
  else if (K.novaMat && K.paint.material === K.novaMat) K.paint.material = paintMat(K.look.paint || '#ff3b5c');
  K.root.visible = !s.hidden;
  K.shadow.visible = s.grounded !== false || s.y - (s.groundY || s.y) < 6;
  if (K.shadow.visible) { K.shadow.position.y = (s.groundY != null ? s.groundY - s.y : 0) + 0.06; const h = Math.max(0, s.y - (s.groundY || s.y)); K.shadow.material.opacity = Math.max(0, 1 - h / 6); }
}
export function disposeKart(K) { K.root.removeFromParent(); }
