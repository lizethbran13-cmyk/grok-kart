// Prop models (smooth, rounded, saturated). Each returns a merged vertex-coloured geometry.
import * as THREE from 'three';
import { Builder, P, lathe, tube, blob, LOW, LOWMAP } from './geo.js';

const cache = {};
export function prop(name) { if (cache[name]) return cache[name]; const f = MAKERS[name]; if (!f) throw new Error('no prop ' + name); return (cache[name] = f()); }
// far-only LOD twin of a prop (same shape + colours, fewer triangles); only drawn for instances far from the camera
export function propLow(name) { const k = name + '|lo'; if (cache[k]) return cache[k]; const f = MAKERS[name]; LOW.on = true; try { cache[k] = f(); } finally { LOW.on = false; } return cache[k]; }
const PI = Math.PI;
const LO = new THREE.SphereGeometry(1, 10, 6), LO2 = new THREE.SphereGeometry(1, 14, 9); LOWMAP.set(LO, new THREE.SphereGeometry(1, 6, 4)); LOWMAP.set(LO2, new THREE.SphereGeometry(1, 7, 5)); // small details: fewer triangles, same look at prop scale

const MAKERS = {
  tree() { const b = new Builder(); b.add(P.cyl, 0x8b5a2b, 0, 1.4, 0, 0, 0, 0, 0.35, 2.8, 0.35);
    b.add(blob(1, 0.12), 0x34c759, 0, 4.2, 0, 0, 0, 0, 2.2, 1.9, 2.2); b.add(blob(2, 0.12), 0x4ade80, 1.0, 3.6, 0.6, 0, 0, 0, 1.4); b.add(blob(3, 0.14), 0x22b14c, -0.9, 3.7, -0.5, 0, 0, 0, 1.5); b.add(blob(4, 0.1), 0x6ee77a, 0.2, 5.4, 0.3, 0, 0, 0, 1.2); return b.build(); },
  lamp() { const b = new Builder(); b.add(P.cyl, 0x334155, 0, 3, 0, 0, 0, 0, 0.12, 6, 0.12); b.add(P.cyl, 0x334155, 0, 0.15, 0, 0, 0, 0, 0.35, 0.3, 0.35);
    b.add(tube([[0, 6, 0], [0, 6.6, 0.3], [0, 6.5, 1.2]], 0.1, 12, 8), 0x334155); b.add(P.sphere, 0xfff3b0, 0, 6.3, 1.25, 0, 0, 0, 0.35, 0.3, 0.35, 2.5); return b.build(); },
  building() { // rounded tower with window bands + roof garden
    const b = new Builder(); const cols = [0xff6b9a, 0x5ac8fa, 0xffcc4d, 0x8b7bff, 0x4ade80, 0xff9f43];
    b.addFn(P.rbox, (c, x, y, z) => { const yy = y - 0.5; const band = (Math.floor((yy + 0.5) * 14) % 2 === 0) && Math.abs(yy) < 0.44 && yy > -0.4; c.set(band ? 0x9fe8ff : 0xf8fafc); if (band) c.multiplyScalar(1.15); }, 0, 0.5, 0, 0, 0, 0, 1, 1, 1);
    b.add(P.rbox, 0xffffff, 0, 1.02, 0, 0, 0, 0, 1.05, 0.06, 1.05); b.add(P.cyl, 0xff4f6d, 0.25, 1.1, 0.2, 0, 0, 0, 0.08, 0.15, 0.08);
    return b.build(); },
  cone() { const b = new Builder(); b.addFn(P.cone, (c, x, y) => c.set(Math.abs(y - 0.05) < 0.12 ? 0xffffff : 0xff6a00), 0, 0.5, 0, 0, 0, 0, 0.35, 1, 0.35); b.add(P.rboxS, 0xff6a00, 0, 0.04, 0, 0, 0, 0, 0.8, 0.08, 0.8); return b.build(); },
  hydrant() { const b = new Builder(); b.add(P.capsule, 0xff2d55, 0, 0.6, 0, 0, 0, 0, 0.5, 0.8, 0.5); b.add(P.cyl, 0xff2d55, 0, 0.6, 0, 0, 0, PI / 2, 0.12, 0.7, 0.12); b.add(P.sphere, 0xffd60a, 0, 1.05, 0, 0, 0, 0, 0.22); return b.build(); },
  cactus() { const b = new Builder(); const g = 0x2fbf71; b.add(P.capsule, g, 0, 2.2, 0, 0, 0, 0, 1.0, 3.6, 1.0);
    b.add(tube([[0, 1.8, 0], [1.2, 1.9, 0], [1.3, 3.2, 0]], 0.38, 16, 12), g); b.add(P.sphere, g, 1.3, 3.2, 0, 0, 0, 0, 0.38);
    b.add(tube([[0, 2.6, 0], [-1.0, 2.6, 0], [-1.05, 3.6, 0]], 0.32, 16, 12), g); b.add(P.sphere, g, -1.05, 3.6, 0, 0, 0, 0, 0.32);
    b.add(P.sphere, 0xff4fd8, 0, 4.25, 0, 0, 0, 0, 0.32); b.add(P.sphere, 0xffe14d, 0, 4.3, 0, 0, 0, 0, 0.14); return b.build(); },
  mesa() { const b = new Builder(); const g = blob(5, 0.06, 4);
    b.addFn(g, (c, x, y) => { const k = Math.floor((y + 1) * 4); c.set([0xd9773b, 0xf2a65a, 0xc8602e, 0xffbf73, 0xe08a45][k % 5]); }, 0, 0, 0, 0, 0, 0, 1, 1, 1);
    return b.build(); },
  rock() { const b = new Builder(); b.add(blob(7, 0.22, 3), 0xc98a5a, 0, 0.4, 0, 0, 0, 0, 1.2, 0.8, 1.0); b.add(blob(8, 0.2, 2), 0xb3734a, 0.9, 0.2, 0.4, 0, 0, 0, 0.6); return b.build(); },
  lollipop() { const b = new Builder(); b.add(P.cyl, 0xffffff, 0, 2, 0, 0, 0, 0, 0.12, 4, 0.12);
    b.addFn(P.cyl, (c, x, y, z) => { const a = Math.atan2(z - 4.6, x) + Math.hypot(x, z - 4.6) * 3; c.set(Math.sin(a * 3) > 0 ? 0xff2e88 : 0xffffff); }, 0, 0, 0, PI / 2, 0, 0, 1.5, 0.35, 1.5);
    const g = b.parts.pop(); g.translate(0, 4.6, 0); b.parts.push(g); return b.build(); },
  cane() { const b = new Builder(); const pts = [[0, 0, 0], [0, 2.5, 0], [0, 4.6, 0], [0.5, 5.4, 0], [1.3, 5.3, 0], [1.6, 4.6, 0]];
    b.addFn(tube(pts, 0.32, 60, 16), (c, x, y, z) => c.set(Math.sin((y + x) * 4) > 0 ? 0xff2e4d : 0xffffff)); return b.build(); },
  gumdrop() { const b = new Builder(); const cols = [0xff4fd8, 0x7cff6b, 0xffe14d, 0x3ff0ff, 0xb26bff, 0xff7a3d]; const col = cols[(Math.random() * 6) | 0];
    b.add(lathe([[0, 0], [1.1, 0], [1.15, 0.2], [1.0, 0.9], [0.6, 1.4], [0, 1.55]], 32), 0xffffff); return b.build(); },
  cupcake() { const b = new Builder(); b.addFn(lathe([[0, 0], [1.5, 0], [1.9, 1.6], [1.95, 1.7], [0, 1.7]], 40), (c, x, y, z) => c.set(Math.sin(Math.atan2(z, x) * 12) > 0 ? 0xffb3d9 : 0xff7ab6));
    for (let i = 0; i < 4; i++) b.add(P.torus, 0xfff5fb, 0, 1.9 + i * 0.5, 0, PI / 2, 0, 0, 1.7 - i * 0.38, 1.7 - i * 0.38, 1.4);
    b.add(P.sphere, 0xff1744, 0, 4.0, 0, 0, 0, 0, 0.42); b.add(tube([[0, 4.3, 0], [0.2, 4.8, 0.1]], 0.05, 6, 6), 0x2e7d32); return b.build(); },
  donut() { const b = new Builder(); b.add(new THREE.TorusGeometry(1.4, 0.7, 14, 32), 0xe0a060, 0, 0.7, 0, PI / 2);
    b.add(new THREE.TorusGeometry(1.4, 0.72, 14, 32), 0xff6fbd, 0, 0.92, 0, PI / 2, 0, 0, 1.0, 1.0, 0.75);
    const sp = [0xffffff, 0xffe14d, 0x3ff0ff, 0x7cff6b]; for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 1.2 + (i % 3) * 0.3; b.add(P.capsuleLo, sp[i % 4], Math.cos(a) * r, 1.45, Math.sin(a) * r, PI / 2, 0, a, 0.08, 0.15, 0.08); }
    return b.build(); },
  palm() { const b = new Builder(); const trunk = []; for (let i = 0; i <= 8; i++) trunk.push([Math.sin(i / 8 * 1.4) * 1.6, i * 0.8, 0]);
    b.addFn(tube(trunk, 0.32, 40, 14), (c, x, y) => c.set(Math.sin(y * 7) > 0 ? 0xa86b3c : 0x8b5a2b));
    const top = trunk[8];
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; const pts = []; for (let k = 0; k <= 6; k++) { const r = k * 0.75; pts.push([top[0] + Math.cos(a) * r, top[1] + 0.3 + Math.sin(k / 6 * PI * 0.9) * 0.9 - k * k * 0.06, Math.sin(a) * r]); }
      b.add(tube(pts, 0.28, 24, 6), i % 2 ? 0x22c55e : 0x16a34a, 0, 0, 0, 0, 0, 0, 1, 0.45, 1); }
    b.add(P.sphere, 0x7a4a1f, top[0] + 0.3, top[1] - 0.2, 0.2, 0, 0, 0, 0.3); b.add(P.sphere, 0x7a4a1f, top[0] - 0.2, top[1] - 0.25, -0.2, 0, 0, 0, 0.3);
    return b.build(); },
  umbrella() { const b = new Builder(); b.add(P.cyl, 0xffffff, 0, 1.6, 0, 0.12, 0, 0, 0.07, 3.2, 0.07);
    b.addFn(lathe([[0, 0.9], [0.8, 0.75], [1.8, 0.35], [2.4, 0]], 40), (c, x, y, z) => c.set(Math.sin(Math.atan2(z, x) * 4) > 0 ? 0xff3b5c : 0xffffff), 0.36, 2.9, 0, 0.12);
    b.add(P.rboxS, 0x38bdf8, 1.2, 0.2, 1.5, 0, 0.3, 0, 1.8, 0.25, 3.2); return b.build(); },
  beachball() { const b = new Builder(); b.addFn(P.sphere, (c, x, y, z) => c.set([0xff3b5c, 0xffffff, 0x2563eb, 0xffd60a, 0xffffff, 0x22c55e][Math.floor((Math.atan2(z, x) + PI) / (PI / 3)) % 6]), 0, 1, 0); return b.build(); },
  sandcastle() { const b = new Builder(); const s = 0xf3c77a; b.add(P.rbox, s, 0, 0.8, 0, 0, 0, 0, 3, 1.6, 3);
    [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([x, z]) => { b.add(P.cyl, s, x, 1.4, z, 0, 0, 0, 0.6, 2.8, 0.6); b.add(P.cone, 0xe8b25f, x, 3.1, z, 0, 0, 0, 0.7, 0.8, 0.7); });
    b.add(P.cyl, 0xffffff, 0, 2.6, 0, 0, 0, 0, 0.04, 2, 0.04); b.add(P.rboxS, 0xff3b5c, 0.35, 3.3, 0, 0, 0, 0, 0.7, 0.4, 0.04); return b.build(); },
  tower() { const b = new Builder(); b.add(P.cyl, 0xffffff, 0, 6, 0, 0, 0, 0, 2, 12, 2); for (let i = 0; i < 3; i++) b.add(P.cyl, 0xff3b5c, 0, 2 + i * 4, 0, 0, 0, 0, 2.02, 1.6, 2.02);
    b.add(P.cyl, 0xfff3b0, 0, 13, 0, 0, 0, 0, 1.4, 2, 1.4, 1.5); b.add(P.cone, 0xff3b5c, 0, 15, 0, 0, 0, 0, 2, 2, 2); return b.build(); },
  deadtree() { const b = new Builder(); const c = 0x4a3557;
    b.add(tube([[0, 0, 0], [0.2, 2, 0], [-0.1, 4, 0.2], [0.3, 6, 0]], 0.4, 20, 10), c);
    b.add(tube([[0.1, 3, 0], [1.2, 4, 0.2], [2.2, 4.6, 0]], 0.18, 12, 8), c); b.add(tube([[0, 4.2, 0], [-1.3, 5.2, -0.3], [-1.8, 6.2, 0]], 0.16, 12, 8), c);
    b.add(tube([[0.2, 5.5, 0], [0.9, 6.6, 0.4], [0.7, 7.4, 0.8]], 0.12, 12, 8), c); return b.build(); },
  tomb() { const b = new Builder(); b.add(lathe([[0, 0], [0.01, 0]], 4), 0x000000);
    b.parts.pop(); const sh = new THREE.Shape(); sh.moveTo(-0.7, 0); sh.lineTo(0.7, 0); sh.lineTo(0.7, 1.3); sh.absarc(0, 1.3, 0.7, 0, PI, false); sh.lineTo(-0.7, 0);
    b.add(new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 4, curveSegments: 24 }), 0xa5b4fc, 0, 0, -0.15);
    b.add(P.rbox, 0x3e8f6a, 0, 0.05, 0.4, 0, 0, 0, 1.6, 0.2, 1.2); return b.build(); },
  pumpkin() { const b = new Builder(); b.addFn(P.sphere, (c, x, y, z) => { const a = Math.atan2(z, x); c.set(0xff7a00).multiplyScalar(0.8 + 0.2 * Math.abs(Math.cos(a * 4))); }, 0, 0.75, 0, 0, 0, 0, 1.0, 0.75, 1.0);
    const g = b.parts[b.parts.length - 1], p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i) - 0.75, a = Math.atan2(z, x), k = 1 - 0.08 * Math.abs(Math.sin(a * 4)); p.setXYZ(i, x * k, y + 0.75, z * k); } g.computeVertexNormals();
    b.add(P.cyl, 0x2e7d32, 0, 1.55, 0, 0.2, 0, 0, 0.1, 0.4, 0.1);
    b.add(P.cone, 0xffe14d, -0.35, 0.95, 0.88, -PI / 2, 0, 0, 0.14, 0.12, 0.14, 2.5); b.add(P.cone, 0xffe14d, 0.35, 0.95, 0.88, -PI / 2, 0, 0, 0.14, 0.12, 0.14, 2.5);
    b.add(P.rboxS, 0xffe14d, 0, 0.55, 0.92, 0, 0, 0, 0.7, 0.14, 0.1, 2.5); return b.build(); },
  lantern() { const b = new Builder(); b.add(P.cyl, 0x312e81, 0, 2, 0, 0, 0, 0, 0.12, 4, 0.12); b.add(P.sphere, 0x7cf7d4, 0, 4.3, 0, 0, 0, 0, 0.45, 0.45, 0.45, 3); b.add(P.cone, 0x312e81, 0, 4.85, 0, 0, 0, 0, 0.5, 0.4, 0.5); return b.build(); },
  castletower() { const b = new Builder(); const st = 0x8b7fb8;
    b.addFn(P.cyl, (c, x, y, z) => { c.set(st).multiplyScalar(0.9 + 0.1 * Math.sin(y * 20) * Math.sin(Math.atan2(z, x) * 10)); }, 0, 9, 0, 0, 0, 0, 3.2, 18, 3.2);
    b.add(P.cyl, 0x9d91c8, 0, 18.5, 0, 0, 0, 0, 3.8, 1.4, 3.8); b.add(P.cone, 0x6d28d9, 0, 23, 0, 0, 0, 0, 4.2, 7.5, 4.2);
    for (let i = 0; i < 5; i++) b.add(P.rboxS, 0xffd166, Math.cos(i * 1.26) * 3.21, 8 + i * 2, Math.sin(i * 1.26) * 3.21, 0, -i * 1.26, 0, 0.1, 1.2, 0.7, 2.2);
    b.add(P.rboxS, 0xff8a1f, 0, 27.5, 0.6, 0, 0, 0, 1.2, 0.8, 0.05); b.add(P.cyl, 0x222222, 0, 26.6, 0, 0, 0, 0, 0.05, 2, 0.05); return b.build(); },
  pine() { const b = new Builder(); b.add(P.cyl, 0x7a4a1f, 0, 0.8, 0, 0, 0, 0, 0.35, 1.6, 0.35);
    for (let i = 0; i < 4; i++) { const r = 2.4 - i * 0.5, y = 1.8 + i * 1.3; b.add(P.cone, 0x16a34a, 0, y + 0.9, 0, 0, 0, 0, r, 2.2, r); b.add(P.cone, 0xffffff, 0, y + 1.5, 0, 0, 0, 0, r * 0.55, 1.0, r * 0.55); }
    return b.build(); },
  snowman() { const b = new Builder(); b.add(P.sphere, 0xffffff, 0, 1.1, 0, 0, 0, 0, 1.2); b.add(P.sphere, 0xffffff, 0, 2.6, 0, 0, 0, 0, 0.85); b.add(P.sphere, 0xffffff, 0, 3.75, 0, 0, 0, 0, 0.6);
    b.add(P.cone, 0xff7a00, 0, 3.75, 0.75, PI / 2, 0, 0, 0.12, 0.6, 0.12); b.add(P.sphere, 0x111111, -0.2, 3.95, 0.52, 0, 0, 0, 0.07); b.add(P.sphere, 0x111111, 0.2, 3.95, 0.52, 0, 0, 0, 0.07);
    b.add(P.torus, 0xff3b5c, 0, 3.25, 0, PI / 2, 0, 0, 0.62, 0.62, 0.9); b.add(P.cyl, 0x222222, 0, 4.4, 0, 0, 0, 0, 0.45, 0.6, 0.45); b.add(P.cyl, 0x222222, 0, 4.12, 0, 0, 0, 0, 0.7, 0.06, 0.7);
    for (let i = 0; i < 3; i++) b.add(P.sphere, 0x111111, 0, 2.3 + i * 0.3, 0.83 - Math.abs(i - 1) * 0.04, 0, 0, 0, 0.07); return b.build(); },
  crystal() { const b = new Builder(); const g = new THREE.OctahedronGeometry(1, 0);
    b.add(g, 0x7dd3fc, 0, 1.6, 0, 0, 0, 0, 0.7, 1.8, 0.7, 0.6); b.add(g, 0xa5f3fc, 0.8, 1.0, 0.3, 0, 0, 0.4, 0.45, 1.1, 0.45, 0.6); b.add(g, 0xbae6fd, -0.6, 0.9, -0.2, 0, 0, -0.5, 0.4, 1, 0.4, 0.6); return b.build(); },
  mountain() { const b = new Builder(); const g = blob(9, 0.08, 4);
    b.addFn(g, (c, x, y) => c.set(y > 0.35 ? 0xffffff : y > 0.2 ? 0xdbeafe : 0x7c9cc4), 0, 0, 0, 0, 0, 0, 1, 1, 1); return b.build(); },
  basalt() { const b = new Builder(); b.add(blob(12, 0.25, 3), 0x4a3a44, 0, 0.6, 0, 0, 0, 0, 1.4, 1.0, 1.2); b.add(blob(13, 0.2, 2), 0x3a2d36, 1.2, 0.3, 0.5, 0, 0, 0, 0.7); return b.build(); },
  lavacrystal() { const b = new Builder(); const g = new THREE.OctahedronGeometry(1, 0);
    b.add(g, 0xff6a00, 0, 1.5, 0, 0.2, 0, 0.1, 0.6, 1.7, 0.6, 1.8); b.add(g, 0xffb000, 0.7, 0.9, 0.3, 0, 0, 0.5, 0.4, 1, 0.4, 1.8); b.add(blob(14, 0.2, 2), 0x3a2d36, 0, 0.2, 0, 0, 0, 0, 1.1, 0.4, 1.1); return b.build(); },
  volcanoCone() { const b = new Builder(); const g = lathe([[0, -0.1], [1.0, 0], [0.82, 0.2], [0.5, 0.55], [0.26, 0.92], [0.2, 1.0], [0.15, 0.93], [0, 0.85]], 64);
    b.addFn(g, (c, x, y) => c.set(y > 0.9 ? 0xff7a00 : y > 0.8 ? 0x6b3a3a : 0x5b4652).multiplyScalar(y > 0.9 ? 2.2 : 1)); return b.build(); },
  asteroid() { const b = new Builder(); b.add(blob(15, 0.28, 3), 0x8b7fb8, 0, 0, 0); b.add(blob(16, 0.25, 2), 0x6d6496, 0.7, 0.4, 0.3, 0, 0, 0, 0.35); return b.build(); },
  pylon() { const b = new Builder(); b.add(P.cyl, 0x2a1a7a, 0, 3, 0, 0, 0, 0, 0.35, 6, 0.35); b.add(P.torus, 0x00e5ff, 0, 5, 0, PI / 2, 0, 0, 0.7, 0.7, 0.7, 2.5); b.add(P.torus, 0xff4fd8, 0, 3.5, 0, PI / 2, 0, 0, 0.6, 0.6, 0.6, 2.5); b.add(P.sphere, 0xffffff, 0, 6.3, 0, 0, 0, 0, 0.4, 0.4, 0.4, 3); return b.build(); },
  cloud() { const b = new Builder(); [[0, 0, 0, 3], [2.8, -0.4, 0.4, 2.3], [-2.8, -0.5, -0.2, 2.2], [1.1, 1.4, -0.3, 2.1], [-1.2, 1.0, 0.5, 1.9], [4.6, -0.8, 0, 1.4], [-4.5, -0.9, 0.2, 1.3]].forEach(([x, y, z, r], i) => b.add(blob(20 + i, 0.06, 2), 0xffffff, x, y, z, 0, 0, 0, r, r * 0.85, r)); return b.build(); },
  bush() { const b = new Builder(); b.add(blob(30, 0.1, 2), 0x4ade80, 0, 0.7, 0, 0, 0, 0, 1.3, 1, 1.3); b.add(blob(31, 0.1, 2), 0x22c55e, 0.9, 0.5, 0.3, 0, 0, 0, 0.8); b.add(P.sphere, 0xff4fd8, 0.4, 1.5, 0.7, 0, 0, 0, 0.18); b.add(P.sphere, 0xffe14d, -0.6, 1.3, 0.6, 0, 0, 0, 0.16); return b.build(); },
  flag() { const b = new Builder(); b.add(P.cyl, 0xffffff, 0, 3, 0, 0, 0, 0, 0.08, 6, 0.08);
    b.addFn(new THREE.PlaneGeometry(2.2, 1.4, 8, 4), (c, x, y) => c.set((Math.floor(x * 2.5 + 10) + Math.floor(y * 2.5 + 10)) % 2 ? 0x111111 : 0xffffff), 1.1, 5.2, 0); return b.build(); },
  // ======== Super Kart Expansion: Ratita Labs ========
  labdome() { const b = new Builder(); b.add(P.cyl, 0xf1f5f9, 0, 1.5, 0, 0, 0, 0, 6, 3, 6); b.add(P.cyl, 0xffd60a, 0, 3.05, 0, 0, 0, 0, 6.15, 0.35, 6.15, 0.3);
    b.addFn(new THREE.SphereGeometry(5.8, 40, 20, 0, PI * 2, 0, PI / 2), (c, x, y, z) => { const a = Math.atan2(z, x); const rib = Math.abs(Math.sin(a * 6)) < 0.08 || Math.abs(Math.sin(y * 1.2)) < 0.07; c.set(rib ? 0xffffff : 0x7fe8ff); }, 0, 3.2, 0);
    b.add(P.cyl, 0x94a3b8, 0, 9.6, 0, 0, 0, 0, 0.15, 1.8, 0.15); b.add(P.sphere, 0xff4fd8, 0, 10.6, 0, 0, 0, 0, 0.35, 0.35, 0.35, 2.5);
    b.add(P.rbox, 0x1e1b4b, 0, 1.2, 5.9, 0, 0, 0, 2.4, 2.4, 0.4); b.add(P.rboxS, 0x22e5ff, 0, 1.2, 6.1, 0, 0, 0, 2.0, 2.0, 0.1, 1.2); return b.build(); },
  cheesesilo() { const b = new Builder(); b.addFn(P.cyl, (c, x, y, z) => { const a = Math.atan2(z, x); const h = Math.sin(a * 5 + y * 0.9) * Math.sin(y * 1.7 + a * 2); c.set(h > 0.82 ? 0xe0a800 : 0xffd23f); }, 0, 5, 0, 0, 0, 0, 2.6, 10, 2.6);
    for (let i = 0; i < 9; i++) { const a = i * 2.3, y = 1.5 + (i * 1.13) % 8; b.add(LO, 0xd99a00, Math.cos(a) * 2.45, y, Math.sin(a) * 2.45, 0, 0, 0, 0.5, 0.55, 0.5); }
    b.add(P.cone, 0xff3b5c, 0, 11.1, 0, 0, 0, 0, 3.0, 2.2, 3.0); b.add(P.sphere, 0xffffff, 0, 12.3, 0, 0, 0, 0, 0.3);
    for (let i = 0; i < 10; i++) b.add(new THREE.CylinderGeometry(1, 1, 1, 6), 0x64748b, 2.75, 0.6 + i * 0.95, 0, 0, 0, PI / 2, 0.05, 0.6, 0.05); [-0.3, 0.3].forEach((z) => b.add(P.cyl, 0x64748b, 2.75, 5, z, 0, 0, 0, 0.05, 10, 0.05)); return b.build(); },
  testtube() { const b = new Builder(); b.add(P.cyl, 0x334155, 0, 0.3, 0, 0, 0, 0, 1.6, 0.6, 1.6); b.add(P.torus, 0x94a3b8, 0, 3.0, 0, PI / 2, 0, 0, 1.25, 1.25, 1.0);
    b.add(lathe([[0, 0.6], [0.95, 0.6], [1.1, 0.9], [1.1, 5.2], [1.25, 5.4], [0, 5.4]], 32), 0xdff7ff); b.addFn(lathe([[0, 0.7], [0.98, 0.75], [1.02, 1.0], [1.02, 3.6], [0, 3.6]], 32), (c, x, y) => c.set(0x39ff9a).multiplyScalar(1.6 + (y > 3.4 ? 0.8 : 0)));
    for (let i = 0; i < 4; i++) b.add(LO, 0xd9ffe9, Math.sin(i * 2) * 0.4, 1.4 + i * 0.6, Math.cos(i * 2) * 0.4, 0, 0, 0, 0.14, 0.14, 0.14, 1); return b.build(); },
  tesla() { const b = new Builder(); b.add(P.cyl, 0x1e1b4b, 0, 0.5, 0, 0, 0, 0, 1.6, 1, 1.6); b.add(P.cyl, 0x94a3b8, 0, 4, 0, 0, 0, 0, 0.4, 7, 0.4);
    for (let i = 0; i < 7; i++) b.add(P.torus, 0xf59e0b, 0, 1.6 + i * 0.85, 0, PI / 2, 0, 0, 0.75 - i * 0.04, 0.75 - i * 0.04, 0.6); b.add(P.torus, 0xe2e8f0, 0, 7.8, 0, PI / 2, 0, 0, 1.4, 1.4, 1.2);
    b.add(P.sphere, 0x22e5ff, 0, 8.1, 0, 0, 0, 0, 0.9, 0.9, 0.9, 2.2); return b.build(); },
  ratstatue() { const b = new Builder(); const f = 0xa9afbd, pk = 0xff9cc0; b.add(P.rbox, 0xf8fafc, 0, 1.5, 0, 0, 0, 0, 5, 3, 5); b.add(P.rbox, 0xffd60a, 0, 3.1, 0, 0, 0, 0, 5.3, 0.3, 5.3);
    b.add(blob(90, 0.03, 3), f, 0, 6.6, 0, 0, 0, 0, 2.4, 2.2, 2.3); b.add(P.sphere, f, 0, 6.0, 2.0, 0, 0, 0, 1.2, 1.0, 1.4); b.add(P.sphere, pk, 0, 6.15, 3.35, 0, 0, 0, 0.32, 0.28, 0.25);
    [-1, 1].forEach((s) => { b.add(P.sphere, f, s * 1.9, 8.6, -0.3, 0, 0, s * 0.3, 1.25, 1.35, 0.35); b.add(P.sphere, pk, s * 1.9, 8.6, -0.05, 0, 0, s * 0.3, 0.85, 0.95, 0.15); b.add(P.sphere, 0x111827, s * 0.75, 7.1, 1.9, 0, 0, 0, 0.3, 0.36, 0.25); b.add(P.sphere, 0xffffff, s * 0.68, 7.25, 2.12, 0, 0, 0, 0.09);
      for (let k = -1; k <= 1; k++) b.add(new THREE.CylinderGeometry(1, 1, 1, 5), 0x334155, s * 1.5, 6.1 + k * 0.18, 2.6, 0, s * 0.2, PI / 2 + k * 0.15 * s, 0.03, 2.0, 0.03); });
    b.add(P.cyl, 0x2563eb, 0, 5.0, 0, 0, 0, 0, 2.0, 0.5, 2.0); b.add(P.rboxS, 0xffd60a, 0, 5.0, 2.0, 0, 0, 0, 0.8, 0.55, 0.15, 0.6); return b.build(); },
  labtower() { const b = new Builder(); b.addFn(P.rbox, (c, x, y, z) => { const yy = y - 0.5; const band = (Math.floor((yy + 0.5) * 16) % 2 === 0) && Math.abs(yy) < 0.45 && yy > -0.42; c.set(band ? 0x9ff6ff : 0xede9fe); if (band) c.multiplyScalar(1.25); }, 0, 0.5, 0, 0, 0, 0, 1, 1, 1);
    b.add(P.rbox, 0xffd60a, 0, 1.0, 0, 0, 0, 0, 1.06, 0.05, 1.06, 0.4); b.add(P.rbox, 0x8b5cf6, 0, 0.02, 0, 0, 0, 0, 1.08, 0.05, 1.08); return b.build(); },
  labtowerFar() { const b = new Builder(); b.addFn(new THREE.BoxGeometry(1, 1, 1, 1, 8, 1), (c, x, y) => c.set(Math.floor((y + 0.5) * 8) % 2 ? 0xede9fe : 0xb6f3ff), 0, 0.5, 0); return b.build(); }, // far-only LOD
  robotarm() { const b = new Builder(); b.add(P.cyl, 0x1e1b4b, 0, 0.4, 0, 0, 0, 0, 1.3, 0.8, 1.3); b.add(P.sphere, 0xffd60a, 0, 1.0, 0, 0, 0, 0, 0.7);
    b.add(P.capsule, 0xff8a1f, 0.9, 2.6, 0, 0, 0, -0.55, 0.7, 2.4, 0.7); b.add(P.sphere, 0x334155, 1.8, 4.2, 0, 0, 0, 0, 0.55); b.add(P.capsule, 0xff8a1f, 3.0, 4.6, 0, 0, 0, -1.3, 0.55, 2.0, 0.55);
    b.add(P.cyl, 0x334155, 4.3, 4.3, 0, 0, 0, 0.3, 0.35, 0.5, 0.35); [-1, 1].forEach((s) => b.add(P.rboxS, 0x94a3b8, 4.55, 3.8, s * 0.25, 0, 0, 0.3, 0.18, 0.8, 0.12));
    b.add(P.cyl, 0xffd23f, 4.6, 3.3, 0, 0, 0, 0, 0.6, 0.4, 0.6); return b.build(); },
  dish() { const b = new Builder(); b.add(P.cyl, 0x94a3b8, 0, 1.8, 0, 0, 0, 0, 0.25, 3.6, 0.25); b.add(P.rbox, 0x475569, 0, 0.3, 0, 0, 0, 0, 1.8, 0.6, 1.8);
    b.addFn(lathe([[0, 0], [1.2, 0.25], [2.2, 0.85], [2.6, 1.3], [2.5, 1.35], [2.1, 0.95], [1.15, 0.35], [0, 0.1]], 40), (c, x, y, z) => c.set(Math.hypot(x, z) > 2.35 ? 0xff4fd8 : 0xf8fafc), 0, 3.8, 0.3, -0.7);
    b.add(P.cyl, 0x334155, 0, 4.9, 1.6, -0.7, 0, 0, 0.06, 2.2, 0.06); b.add(P.sphere, 0x22e5ff, 0, 5.6, 2.3, 0, 0, 0, 0.25, 0.25, 0.25, 2); return b.build(); },
  cheesewheel() { const b = new Builder(); b.addFn(P.cyl, (c, x, y, z) => c.set(Math.abs(y) > 0.45 ? 0xffd23f : 0xf2b70f), 0, 0.7, 0, 0, 0, 0, 2.0, 1.4, 2.0);
    for (let i = 0; i < 6; i++) { const a = i * 1.1, r = 0.5 + (i % 3) * 0.5; b.add(LO, 0xdc9e00, Math.cos(a) * r, 1.41, Math.sin(a) * r, 0, 0, 0, 0.25, 0.06, 0.25); }
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(2.0, 0); s.absarc(0, 0, 2.0, 0, 0.7, false); s.lineTo(0, 0);
    const w = new THREE.ExtrudeGeometry(s, { depth: 1.0, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 10 }); w.rotateX(-PI / 2); b.add(w, 0xffd23f, 0.6, 1.45, 2.8, 0, 1.2, 0); return b.build(); },
  labcrate() { const b = new Builder(); b.add(P.rbox, 0x2563eb, 0, 0.8, 0, 0, 0, 0, 1.6, 1.6, 1.6); b.add(P.rboxS, 0xffd60a, 0, 0.8, 0.81, 0, 0, 0, 1.2, 0.35, 0.04); b.add(P.rboxS, 0xffd60a, 0.81, 0.8, 0, 0, 0, 0, 0.04, 0.35, 1.2);
    b.add(P.rbox, 0xff4fd8, 0.4, 2.0, 0.1, 0, 0.5, 0, 0.9, 0.8, 0.9); b.add(P.sphere, 0xffd23f, -0.3, 1.9, -0.3, 0, 0, 0, 0.35, 0.3, 0.35); return b.build(); },
  neonpost() { const b = new Builder(); b.add(P.cyl, 0x1e1b4b, 0, 2.2, 0, 0, 0, 0, 0.16, 4.4, 0.16); b.add(P.cyl, 0x1e1b4b, 0, 0.12, 0, 0, 0, 0, 0.45, 0.24, 0.45);
    b.add(P.capsule, 0x22e5ff, 0, 3.4, 0, 0, 0, 0, 0.32, 1.6, 0.32, 2.0); b.add(P.sphere, 0xff4fd8, 0, 4.6, 0, 0, 0, 0, 0.26, 0.26, 0.26, 2.0); return b.build(); },
  // ======== Super Kart Expansion: Torty's Garden ========
  sunflower() { const b = new Builder(); b.add(tube([[0, 0, 0], [0.2, 3, 0], [0.1, 6, 0.2], [0, 8.2, 0.6]], 0.22, 24, 10), 0x2f9e44);
    [[2.4, 1], [4.4, -1]].forEach(([y, s]) => b.add(LO2, 0x37b24d, s * 0.9, y, 0.1, 0, 0, s * 0.6, 1.0, 0.15, 0.5));
    const hg = new THREE.Group(); const fb = new Builder();
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; fb.add(LO, i % 2 ? 0xffd43b : 0xfcc419, Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0, 0, 0, a, 0.85, 0.36, 0.12); }
    fb.addFn(P.sphere, (c, x, y) => c.set(Math.sin(x * 9) * Math.sin(y * 9) > 0 ? 0x7a3e12 : 0x5c2d0c), 0, 0, 0.1, 0, 0, 0, 0.95, 0.95, 0.3);
    const head = fb.build(); head.rotateX(-0.35); head.translate(0, 8.6, 0.8); b.parts.push(head.toNonIndexed ? head : head); return b.build(); },
  mushroom() { const b = new Builder(); b.add(lathe([[0, 0], [0.75, 0], [0.62, 1.4], [0.7, 2.4], [0, 2.4]], 24), 0xfff7ed);
    b.add(new THREE.SphereGeometry(2.0, 32, 14, 0, PI * 2, 0, PI * 0.5), 0xff3b3b, 0, 2.2, 0, 0, 0, 0, 1, 0.75, 1); b.add(P.cyl, 0xffe8d6, 0, 2.2, 0, 0, 0, 0, 1.95, 0.08, 1.95);
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.5 + (i % 3) * 0.5; const y = Math.sqrt(Math.max(0, 4 - r * r)) * 0.75; b.add(LO, 0xffffff, Math.cos(a) * r, 2.2 + y, Math.sin(a) * r, 0, 0, 0, 0.3, 0.12, 0.3); } return b.build(); },
  carrot() { const b = new Builder(); b.addFn(P.cone, (c, x, y) => c.set(Math.sin(y * 9) > 0.7 ? 0xe8590c : 0xff7a1a), 0, 1.3, 0, PI, 0, 0, 1.1, 3.0, 1.1); const g = b.parts.pop(); g.translate(0, 0.2, 0); b.parts.push(g);
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; b.add(tube([[0, 2.6, 0], [Math.cos(a) * 0.5, 3.6, Math.sin(a) * 0.5], [Math.cos(a) * 1.0, 4.4, Math.sin(a) * 1.0]], 0.14, 10, 6), 0x40c057); } return b.build(); },
  lettuce() { const b = new Builder(); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; b.add(blob(100 + i, 0.15, 2), i % 2 ? 0x8ce99a : 0x51cf66, Math.cos(a) * 0.9, 0.8, Math.sin(a) * 0.9, 0.4, -a, 0, 1.0, 0.8, 0.5); } b.add(blob(99, 0.1, 2), 0xb2f2bb, 0, 1.1, 0, 0, 0, 0, 0.9); return b.build(); },
  fence() { const b = new Builder(); for (let i = -2; i <= 2; i++) { b.add(P.rboxS, 0xfffaf0, i * 0.9, 0.85, 0, 0, 0, 0, 0.5, 1.7, 0.14); b.add(P.cone, 0xfffaf0, i * 0.9, 1.85, 0, 0, PI / 4, 0, 0.36, 0.35, 0.1); }
    [0.5, 1.25].forEach((y) => b.add(P.rboxS, 0xf1e6d0, 0, y, -0.1, 0, 0, 0, 4.6, 0.18, 0.08)); return b.build(); },
  flowerbed() { const b = new Builder(); b.add(lathe([[0, 0.3], [2.0, 0.3], [2.1, 0], [0, 0]], 28), 0x8d5524, 0, 0, 0, 0, 0, 0, 1, 1, 0.6); b.add(new THREE.SphereGeometry(1.9, 24, 8, 0, PI * 2, 0, PI * 0.35), 0x2f9e44, 0, -0.65, 0, 0, 0, 0, 1, 1, 0.6);
    const cols = [0xff4fd8, 0xffd43b, 0xff6b6b, 0xb26bff, 0xffffff, 0xff922b]; for (let i = 0; i < 10; i++) { const a = i * 2.39, r = (i % 4) * 0.45 + 0.25; const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.6; b.add(new THREE.CylinderGeometry(1, 1, 1, 5), 0x2b8a3e, x, 0.6, z, 0, 0, 0, 0.04, 0.6, 0.04);
      b.add(LO, cols[i % 6], x, 0.95, z, 0, i, 0, 0.3, 0.07, 0.3); b.add(LO, 0xffe066, x, 0.99, z, 0, 0, 0, 0.09, 0.05, 0.09); } return b.build(); },
  gnome() { const b = new Builder(); b.add(lathe([[0, 0], [0.55, 0], [0.6, 0.4], [0.5, 1.0], [0, 1.05]], 20), 0x2563eb); b.add(P.rboxS, 0x7a4a1f, 0, 0.55, 0, 0, 0, 0, 1.16, 0.12, 1.0);
    b.add(P.sphere, 0xffd8b5, 0, 1.3, 0, 0, 0, 0, 0.38); b.add(P.sphere, 0xffb4a2, 0, 1.25, 0.36, 0, 0, 0, 0.12); b.add(lathe([[0, 0], [0.32, 0.05], [0.25, 0.4], [0, 0.65]], 16), 0xffffff, 0, 0.75, 0.2);
    b.add(P.cone, 0xff3b3b, 0, 1.95, 0, -0.15, 0, 0, 0.42, 1.1, 0.42); [-0.13, 0.13].forEach((x) => b.add(P.sphere, 0x111827, x, 1.38, 0.33, 0, 0, 0, 0.05)); return b.build(); },
  greenhouse() { const b = new Builder(); b.add(P.rbox, 0xfffaf0, 0, 0.3, 0, 0, 0, 0, 7.2, 0.6, 5.2);
    b.addFn(new THREE.CylinderGeometry(2.6, 2.6, 7, 24, 1, false, 0, PI), (c, x, y, z) => c.set(Math.abs(Math.sin(y * 1.8)) < 0.08 ? 0xffffff : 0xc5f6fa), 0, 2.6, 0, 0, 0, PI / 2, 1, 1, 1);
    b.add(P.rbox, 0xc5f6fa, 0, 1.6, 0, 0, 0, 0, 7.0, 2.0, 5.1); for (let i = -3; i <= 3; i++) b.add(P.rboxS, 0xffffff, i * 1.15, 2.3, 0, 0, 0, 0, 0.1, 4.6, 5.25);
    b.add(P.rbox, 0x2f9e44, 0, 1.3, 0, 0, 0, 0, 5.5, 1.2, 3.4); b.add(P.rboxS, 0xff7ab6, 0, 3.2, 2.6, 0, 0, 0, 2.4, 0.7, 0.12, 0.4); return b.build(); },
  topiary() { const b = new Builder(); const g = 0x2b8a3e, l = 0x40c057; // Torty-shaped hedge
    b.add(lathe([[0, 0], [1.6, 0], [1.7, 0.5], [0, 0.6]], 24), 0xb35c1e, 0, 0, 0, 0, 0, 0, 2.2, 1, 2.2);
    b.addFn(blob(120, 0.07, 3), (c, x, y, z) => c.set(Math.sin(x * 2.2) * Math.sin(z * 2.2) > 0.25 ? l : g), 0, 2.3, 0, 0, 0, 0, 3.0, 1.9, 3.4);
    b.add(blob(121, 0.08, 2), l, 0, 2.6, 3.6, 0, 0, 0, 1.2, 1.1, 1.2); [-1, 1].forEach((s) => { b.add(blob(122, 0.1, 2), g, s * 2.4, 0.9, 2.0, 0, 0, 0, 0.8, 0.7, 0.8); b.add(blob(123, 0.1, 2), g, s * 2.4, 0.9, -2.0, 0, 0, 0, 0.8, 0.7, 0.8);
      b.add(P.sphere, 0xffffff, s * 0.45, 3.0, 4.55, 0, 0, 0, 0.26); b.add(P.sphere, 0x111827, s * 0.45, 3.0, 4.75, 0, 0, 0, 0.13); });
    b.add(P.torus, 0xff4fd8, 0, 3.6, 3.4, PI / 2, 0, 0, 0.7, 0.7, 0.8); b.add(P.sphere, 0xff4fd8, 0.6, 3.75, 3.5, 0, 0, 0, 0.25); return b.build(); },
  wateringcan() { const b = new Builder(); b.add(lathe([[0, 0], [1.2, 0], [1.25, 0.2], [1.2, 1.9], [0, 1.95]], 28), 0x22b8cf); b.add(P.torus, 0x1098ad, 0, 1.95, 0, PI / 2, 0, 0, 1.15, 1.15, 0.5);
    b.add(tube([[0.9, 0.5, 0], [2.0, 1.4, 0], [2.6, 2.3, 0]], 0.18, 14, 10), 0x22b8cf); b.add(P.cone, 0x1098ad, 2.75, 2.5, 0, 0, 0, -0.6, 0.35, 0.5, 0.35);
    b.add(tube([[-0.6, 2.0, 0], [-0.3, 2.9, 0], [0.5, 2.9, 0], [0.8, 2.0, 0]], 0.1, 16, 8), 0x0c8599); return b.build(); },
  hill() { const b = new Builder(); b.addFn(blob(130, 0.12, 2), (c, x, y) => c.set(y > 0.55 ? 0x8ce99a : y > 0.1 ? 0x51cf66 : 0x37b24d), 0, 0, 0, 0, 0, 0, 1, 1, 1); return b.build(); }, // far-only, low poly
  butterflies() { const b = new Builder(); [[0, 0, 0, 0xff4fd8], [1.4, 0.6, 0.5, 0xffd43b], [-1.1, 1.1, -0.4, 0x4dabf7]].forEach(([x, y, z, c]) => { [-1, 1].forEach((s) => { b.add(LO, c, x + s * 0.32, y + 2.5, z, 0, 0, s * 0.5, 0.35, 0.05, 0.28); b.add(LO, c, x + s * 0.24, y + 2.32, z - 0.1, 0, 0, s * 0.5, 0.22, 0.04, 0.18); }); b.add(P.capsuleLo, 0x212529, x, y + 2.45, z, 0, 0, 0, 0.08, 0.3, 0.08); }); return b.build(); },
  potplant() { const b = new Builder(); b.add(lathe([[0, 0], [0.9, 0], [1.25, 1.6], [1.4, 1.65], [1.4, 1.85], [0, 1.85]], 28), 0xd9480f); b.add(P.cyl, 0x5c2d0c, 0, 1.8, 0, 0, 0, 0, 1.25, 0.1, 1.25);
    b.add(blob(140, 0.12, 2), 0x40c057, 0, 2.6, 0, 0, 0, 0, 1.2, 1.0, 1.2); [0xff4fd8, 0xffd43b, 0xff6b6b].forEach((c, i) => b.add(P.sphere, c, Math.cos(i * 2.1) * 0.8, 3.1, Math.sin(i * 2.1) * 0.8, 0, 0, 0, 0.28)); return b.build(); },
};

