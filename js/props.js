// Prop models (smooth, rounded, saturated). Each returns a merged vertex-coloured geometry.
import * as THREE from 'three';
import { Builder, P, lathe, tube, blob } from './geo.js';

const cache = {};
export function prop(name) { if (cache[name]) return cache[name]; const f = MAKERS[name]; if (!f) throw new Error('no prop ' + name); return (cache[name] = f()); }
const PI = Math.PI;

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
  donut() { const b = new Builder(); b.add(new THREE.TorusGeometry(1.4, 0.7, 20, 40), 0xe0a060, 0, 0.7, 0, PI / 2);
    b.add(new THREE.TorusGeometry(1.4, 0.72, 20, 40, PI * 2), 0xff6fbd, 0, 0.92, 0, PI / 2, 0, 0, 1.0, 1.0, 0.75);
    const sp = [0xffffff, 0xffe14d, 0x3ff0ff, 0x7cff6b]; for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 1.2 + (i % 3) * 0.3; b.add(P.capsule, sp[i % 4], Math.cos(a) * r, 1.45, Math.sin(a) * r, PI / 2, 0, a, 0.08, 0.15, 0.08); }
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
};
