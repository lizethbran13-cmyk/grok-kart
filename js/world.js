// Assemble a track world: road ribbon, curbs, shoulders, embankments, walls, gate, pads, ramps, set dressing.
import * as THREE from 'three';
import { sweep, runs, SH, pointAt } from './track.js';
import { THEMES, roadMaterial, groundMaterial, vcMaterial } from './themes.js';
import { prop } from './props.js';
import { Builder, P, lathe, blob } from './geo.js';
import { rng, canvasTex } from './util.js';

const PI = Math.PI;
export function buildWorld(D, scene, quality) {
  const T = D.T, th = THEMES[T.theme], hw = D.hw, R = rng(T.id.length * 977 + 13);
  const grp = new THREE.Group(); grp.name = 'world'; scene.add(grp);
  const W = { grp, anim: [], D, th };
  const add = (m, shadow = true, recv = true) => { m.castShadow = shadow; m.receiveShadow = recv; grp.add(m); return m; };
  let minY = 1e9; for (let i = 0; i < D.N; i++) minY = Math.min(minY, D.Y[i]); W.minY = minY;
  const baseY = T.theme === 'volcano' ? minY - 7 : minY - 0.4; W.baseY = baseY;
  // ---- road ----
  const roadProf = () => { const a = []; for (let k = 0; k <= 8; k++) { const lat = -hw + k / 8 * hw * 2; a.push([lat, 0, k / 8]); } return a; };
  runs(D, (i) => !D.GAP[i]).forEach((rg) => {
    add(new THREE.Mesh(sweep(D, roadProf, { range: rg, vScale: 8 }), roadMaterial(th.road)), false, true);
    // curbs: rounded strip with stripes
    const c1 = new THREE.Color(th.curb[0]), c2 = new THREE.Color(th.curb[1]);
    [-1, 1].forEach((sd) => {
      const prof = (i) => { const st = Math.floor(D.S[i] / 3) % 2 ? c1 : c2, cc = [st.r, st.g, st.b]; const e = sd * hw; return [[e - sd * 1.1, 0.0, 0, cc], [e - sd * 0.85, 0.09, 0, cc], [e - sd * 0.3, 0.12, 0, cc], [e + sd * 0.05, 0.06, 0, cc], [e + sd * 0.3, -0.25, 0, cc]]; };
      add(new THREE.Mesh(sweep(D, prof, { range: rg, colors: true, flip: sd < 0 }), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 })), false, true);
    });
    // slab underside + sides for real thickness (visible over voids)
    const slab = (i) => [[hw + 0.3, -0.25], [hw + 0.2, -1.4], [hw - 1.5, -2.0], [-hw + 1.5, -2.0], [-hw - 0.2, -1.4], [-hw - 0.3, -0.25]];
    add(new THREE.Mesh(sweep(D, slab, { range: rg }), new THREE.MeshStandardMaterial({ color: th.road === 'neon' ? 0x2a1a7a : th.road === 'candy' ? 0xffb3e0 : th.road === 'boardwalk' ? 0x8b5a2b : 0x6b6f80, roughness: 0.7, emissive: th.road === 'neon' ? 0x1a0a50 : 0 })), true, true);
  });
  // ---- shoulders + embankment (non-void) ----
  const gm = groundMaterial(th.ground);
  if (gm) {
    const prof = (sd) => (i) => { const e = sd * hw; const a = [[e + sd * 0.25, -0.02], [e + sd * (SH + 3), -0.02], [e + sd * (SH + 16), baseY - D.Y[i] - 0.3]]; return a.map(([l, dy]) => { const p = [l, dy]; return p; }); };
    runs(D, (i) => !D.VOID[i]).forEach((rg) => [-1, 1].forEach((sd) => {
      const g = sweep(D, prof(sd), { range: rg, flip: sd < 0 });
      // world-space UVs for ground tiling
      const p = g.attributes.position, uv = g.attributes.uv; for (let k = 0; k < p.count; k++) uv.setXY(k, p.getX(k) / 12, p.getZ(k) / 12);
      add(new THREE.Mesh(g, gm), false, true);
    }));
    // flat outer ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 1, 1), gm); ground.rotation.x = -PI / 2; ground.position.y = baseY - 0.25;
    const gu = ground.geometry.attributes.uv; for (let k = 0; k < gu.count; k++) gu.setXY(k, gu.getX(k) * 200, gu.getY(k) * 200);
    add(ground, false, true);
  }
  // ---- walls along the boundary (gaps at voids + shortcut mouths) ----
  const nearBranch = (i) => D.branches.some((b) => { for (let k = 0; k < b.n; k += 2) { if ((b.X[k] - D.X[i]) ** 2 + (b.Z[k] - D.Z[i]) ** 2 < (hw + SH + 8) ** 2) return true; } return false; });
  const wallOK = new Uint8Array(D.N); for (let i = 0; i < D.N; i++) wallOK[i] = !D.VOID[i] && !nearBranch(i) ? 1 : 0;
  const wc1 = new THREE.Color(th.wall[0]), wc2 = new THREE.Color(th.wall[1]);
  runs(D, (i) => wallOK[i]).forEach((rg) => [-1, 1].forEach((sd) => {
    const prof = (i) => { const e = sd * (hw + SH); const st = Math.floor(D.S[i] / 6) % 2 ? wc1 : wc2; const cc = [st.r, st.g, st.b]; const r = 0.5;
      const a = []; for (let k = 0; k <= 10; k++) { const ang = k / 10 * PI; a.push([e + sd * (Math.cos(ang) * r), 0.6 + Math.sin(ang) * 0.55 - (k === 0 || k === 10 ? 0.9 : 0), 0, cc]); } return a; };
    add(new THREE.Mesh(sweep(D, prof, { range: rg, colors: true, flip: sd > 0 }), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.6 })), true, true);
  }));
  // ---- start gate + grid ----
  { const p = pointAt(D, 0, 0); const g = new THREE.Group(); g.position.set(p.x, p.y, p.z); g.rotation.y = p.yaw;
    const b = new Builder(); [-1, 1].forEach((s) => { b.add(P.cyl, 0xffffff, s * (hw + 1.5), 4, 0, 0, 0, 0, 0.6, 8, 0.6); b.add(P.sphere, th.wall[0], s * (hw + 1.5), 8.3, 0, 0, 0, 0, 0.9); });
    b.add(P.rbox, th.wall[1], 0, 8.2, 0, 0, 0, 0, hw * 2 + 4, 1.6, 0.6);
    const g2 = new THREE.Mesh(b.build(), vcMaterial(true)); g2.castShadow = true; g.add(g2);
    const ban = canvasTex('banner', 512, (c, S) => { c.fillStyle = '#111'; c.fillRect(0, 0, S, S); for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { c.fillStyle = (x + y) % 2 ? '#fff' : '#111'; c.fillRect(x * 32, y * 32, 32, 32); c.fillRect(x * 32, S - 64 + y * 32, 32, 32); } c.fillStyle = '#ffe14d'; c.font = 'bold 150px Arial Black, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GROK', S / 2, S / 2 - 50); c.fillStyle = '#ff4fd8'; c.font = 'bold 90px Arial Black, Arial'; c.fillText('KART', S / 2, S / 2 + 80); });
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 + 3, 1.4), new THREE.MeshStandardMaterial({ map: ban, emissive: 0xffffff, emissiveMap: ban, emissiveIntensity: 0.35 }));
    ban.repeat.set(1, 0.36); ban.offset.set(0, 0.32); bm.position.set(0, 8.2, -0.32); bm.rotation.y = PI; g.add(bm); const bm2 = bm.clone(); bm2.position.z = 0.32; bm2.rotation.y = 0; g.add(bm2);
    grp.add(g);
    // checkered start line decal
    const chk = canvasTex('chk', 256, (c, S) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { c.fillStyle = (x + y) % 2 ? '#fff' : '#111'; c.fillRect(x * 16, y * 16, 16, 16); } });
    const line = new THREE.Mesh(sweep(D, () => [[-hw, 0.03, 0], [hw, 0.03, 1]], { range: [0, 2], vScale: 2.2 }), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
    chk.repeat.set(1, 1); line.receiveShadow = true; grp.add(line);
  }
  // ---- boost pads ----
  const padTex = canvasTex('pad', 256, (c, S) => { const gr = c.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, '#ff8a1f'); gr.addColorStop(1, '#ffd60a'); c.fillStyle = '#ff4fd8'; c.fillRect(0, 0, S, S); for (let k = 0; k < 2; k++) { c.fillStyle = gr; c.beginPath(); const y = k * S / 2; c.moveTo(S * 0.1, y + S * 0.42); c.lineTo(S / 2, y + S * 0.08); c.lineTo(S * 0.9, y + S * 0.42); c.lineTo(S * 0.9, y + S * 0.3); c.lineTo(S / 2, y - S * 0.04 + S * 0.0); c.lineTo(S * 0.1, y + S * 0.3); c.closePath(); c.fill(); } });
  const padMat = new THREE.MeshStandardMaterial({ map: padTex, emissive: 0xffffff, emissiveMap: padTex, emissiveIntensity: 0.9, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -3 });
  W.pads = [];
  (T.boosts || []).forEach((b) => { const s = b.u * D.L, lat = b.off * hw * 0.7; const g = sweep(D, () => [[lat - 2.2, 0.05, 0], [lat + 2.2, 0.05, 1]], { range: [D.uIdx(b.u), 4], vScale: 6 }); const m = new THREE.Mesh(g, padMat); m.receiveShadow = true; grp.add(m); W.pads.push({ s, lat, len: 6, hw: 2.3 }); });
  // shortcut pads at branch entries
  D.branches.forEach((br) => { if (!br.boost) return; const k = Math.min(6, br.n - 2); const x = br.X[k], z = br.Z[k], y = br.Y[k]; const dx = br.X[k + 1] - x, dz = br.Z[k + 1] - z;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5), padMat); m.rotation.x = -PI / 2; m.rotation.z = Math.atan2(dx, dz) + PI; m.position.set(x, y + 0.08, z); grp.add(m); br.pad = { x, z, r: 2.6 }; });
  padTex.wrapT = THREE.RepeatWrapping; W.anim.push((dt) => { padTex.offset.y -= dt * 1.6; });
  // shortcut dirt paths
  D.branches.forEach((br) => {
    const pos = [], idx = [], uv = []; for (let k = 0; k < br.n; k++) { const a = Math.max(0, k - 1), b = Math.min(br.n - 1, k + 1); let tx = br.X[b] - br.X[a], tz = br.Z[b] - br.Z[a]; const l = Math.hypot(tx, tz) || 1; const rx = -tz / l, rz = tx / l;
      [-1, 1].forEach((s) => { pos.push(br.X[k] + rx * s * (br.hw + 0.6), br.Y[k] + 0.04, br.Z[k] + rz * s * (br.hw + 0.6)); uv.push(s < 0 ? 0 : 1, k / 3); }); if (k < br.n - 1) { const o = k * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, groundMaterial('dirt').clone()); m.material.polygonOffset = true; m.material.polygonOffsetFactor = -2; m.receiveShadow = true; grp.add(m);
    if (!gm) { const und = m.clone(); und.position.y = -0.6; grp.add(und); }
  });
  // ---- ramps ----
  W.ramps = [];
  const rampMat = new THREE.MeshPhysicalMaterial({ map: canvasTex('ramp', 256, (c, S) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffd60a' : '#1f2433'; c.beginPath(); c.moveTo(i * 64 - 128, S); c.lineTo(i * 64 - 64, S); c.lineTo(i * 64 + 64, 0); c.lineTo(i * 64, 0); c.fill(); } }), roughness: 0.4, clearcoat: 0.5 });
  const glideMat = new THREE.MeshPhysicalMaterial({ map: canvasTex('glide', 256, (c, S) => { c.fillStyle = '#19c3ff'; c.fillRect(0, 0, S, S); c.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(S * 0.2, i * 64 + 50); c.lineTo(S / 2, i * 64 + 14); c.lineTo(S * 0.8, i * 64 + 50); c.lineTo(S * 0.8, i * 64 + 40); c.lineTo(S / 2, i * 64 + 4); c.lineTo(S * 0.2, i * 64 + 40); c.fill(); } }), emissive: 0x0a4a80, roughness: 0.3, clearcoat: 0.8 });
  const mkRamp = (u, off, wf, len, hgt, mat, glide) => {
    const i0 = D.uIdx(u), steps = Math.round(len / 2); const lat = off * hw * 0.6, w = wf * hw * 2;
    const prof = (i, k) => { const t = k / steps, h = hgt * Math.pow(t, 1.4); return [[lat - w / 2, -0.1, 0], [lat - w / 2, h, 0.02], [lat + w / 2, h, 0.98], [lat + w / 2, -0.1, 1]]; };
    const m = new THREE.Mesh(sweep(D, prof, { range: [i0, steps + 1], vScale: len }), mat); m.castShadow = true; m.receiveShadow = true; grp.add(m);
    W.ramps.push({ s0: D.S[i0], s1: D.S[(i0 + steps) % D.N] || D.L, lat, hw: w / 2, h: hgt, glide: !!glide });
  };
  (T.ramps || []).forEach((r) => mkRamp(r.u, r.off, r.w, 8, 1.4, rampMat, false));
  (T.glide || []).forEach((r) => mkRamp(r.u, 0, 1.0, 14, 2.6, glideMat, true));
  // gap edge markers (glowing arches on both sides of a chasm)
  runs(D, (i) => D.GAP[i]).forEach(([st, n]) => { [st, (st + n - 1) % D.N].forEach((i) => { const p = pointAt(D, D.S[i], 0); const b = new Builder(); [-1, 1].forEach((s) => b.add(P.cyl, 0x19c3ff, s * (hw + 0.8), 1.8, 0, 0, 0, 0, 0.3, 3.6, 0.3, 1.2)); const m = new THREE.Mesh(b.build(), vcMaterial(true)); m.position.set(p.x, p.y, p.z); m.rotation.y = p.yaw; grp.add(m); }); });
  // ---- decor ----
  decorate(W, D, T, th, R, quality, add, baseY);
  return W;
}

// spatial check: far enough from every part of the track?
function farFromTrack(D, x, z, minD) {
  const m2 = minD * minD; for (let i = 0; i < D.N; i += 2) if ((D.X[i] - x) ** 2 + (D.Z[i] - z) ** 2 < m2) return false;
  for (const b of D.branches) for (let k = 0; k < b.n; k++) if ((b.X[k] - x) ** 2 + (b.Z[k] - z) ** 2 < (b.hw + 6) ** 2) return false;
  return true;
}
function nearestY(D, x, z) { let bd = 1e18, y = 0; for (let i = 0; i < D.N; i += 2) { const d = (D.X[i] - x) ** 2 + (D.Z[i] - z) ** 2; if (d < bd) { bd = d; y = D.Y[i]; } } return { y, d: Math.sqrt(bd) }; }

function instances(W, name, list, opts = {}) {
  if (!list.length) return null;
  const g = prop(name); const im = new THREE.InstancedMesh(g, opts.mat || vcMaterial(!!opts.gloss), list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  list.forEach((it, k) => { e.set(it.rx || 0, it.ry || 0, it.rz || 0); q.setFromEuler(e); m.compose(v.set(it.x, it.y, it.z), q, s.set(it.s, it.sy || it.s, it.s)); im.setMatrixAt(k, m); if (it.c != null) im.setColorAt(k, c.set(it.c)); });
  im.castShadow = opts.shadow !== false; im.receiveShadow = true; im.frustumCulled = true; im.computeBoundingSphere();
  W.grp.add(im); return im;
}

function decorate(W, D, T, th, R, quality, add, baseY) {
  const hw = D.hw, edge = hw + SH + 2.5;
  // scatter positions around the track
  const scatter = (n, dmin, dmax, ymode) => { const out = []; let tries = 0; while (out.length < n && tries++ < n * 30) { const i = (R() * D.N) | 0; const side = R() < 0.5 ? -1 : 1; const d = dmin + R() * (dmax - dmin); const rx = -D.TZ[i], rz = D.TX[i]; const x = D.X[i] + rx * side * d, z = D.Z[i] + rz * side * d;
    if (!farFromTrack(D, x, z, dmin - 0.5)) continue; const ny = nearestY(D, x, z); let y = ny.d < hw + SH + 3 ? ny.y : Math.max(baseY, ny.y - (ny.d - (hw + SH + 3)) / 13 * (ny.y - baseY));
    if (D.VOID[i]) y = ymode === 'float' ? ny.y - 6 - R() * 20 : baseY; out.push({ x, y: y - 0.1, z, ry: R() * PI * 2, s: 1, i }); } return out; };
  const q = quality === 'low' ? 0.5 : 1; const N = (n) => Math.round(n * q);
  const ring = (n, r0, r1, yf) => { const out = []; let cx = 0, cz = 0; for (let i = 0; i < D.N; i++) { cx += D.X[i]; cz += D.Z[i]; } cx /= D.N; cz /= D.N; let maxr = 0; for (let i = 0; i < D.N; i++) maxr = Math.max(maxr, Math.hypot(D.X[i] - cx, D.Z[i] - cz)); for (let k = 0; k < n; k++) { const a = k / n * PI * 2 + R() * 0.3, r = maxr + r0 + R() * (r1 - r0); out.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: yf != null ? yf : baseY, ry: R() * 6, s: 1, a }); } return out; };
  const clouds = (col, n = 14) => { if (!th.env.clouds) return; const l = ring(n, 60, 380, 0).map((p) => Object.assign(p, { y: 70 + R() * 70, s: 3 + R() * 4, sy: 2 + R() * 2.5, c: col || th.env.clouds })); instances(W, 'cloud', l, { shadow: false, mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.25 }) }); };
  const sz = (l, a, b) => { l.forEach((p) => { p.s = a + R() * (b - a); }); return l; };
  switch (th.decor) {
    case 'city': {
      const bl = scatter(N(70), edge + 10, edge + 70); bl.forEach((p) => { const h = 18 + R() * 40; p.s = 10 + R() * 6; p.sy = h; p.c = [0xff8fb3, 0x7fd3ff, 0xffd166, 0xa79bff, 0x7ee8a2, 0xffb27a][(R() * 6) | 0]; p.ry = Math.round(p.ry / (PI / 2)) * PI / 2; });
      instances(W, 'building', bl, {}); instances(W, 'tree', sz(scatter(N(90), edge, edge + 14), 0.8, 1.3), {}); instances(W, 'lamp', scatter(N(40), hw + SH + 1.2, hw + SH + 1.8).map((p) => { p.ry = Math.atan2(D.X[p.i] - p.x, D.Z[p.i] - p.z); return p; }), {});
      instances(W, 'bush', sz(scatter(N(60), edge, edge + 25), 0.8, 1.4), {}); instances(W, 'hydrant', scatter(N(20), edge, edge + 6), { gloss: true });
      const far = ring(N(40), 80, 260).map((p) => Object.assign(p, { s: 18 + R() * 12, sy: 40 + R() * 90, c: [0xbfe3ff, 0xffd1e6, 0xe2d4ff, 0xc8f7dc][(R() * 4) | 0] })); instances(W, 'building', far, { shadow: false }); clouds(); break; }
    case 'desert': {
      instances(W, 'cactus', sz(scatter(N(80), edge, edge + 40), 0.8, 1.5), {}); instances(W, 'rock', sz(scatter(N(60), edge, edge + 50), 0.8, 2.2), {});
      const ms = ring(N(26), 40, 220).map((p) => Object.assign(p, { s: 30 + R() * 40, sy: 25 + R() * 40 })); instances(W, 'mesa', ms, { shadow: false });
      instances(W, 'mesa', scatter(N(10), edge + 30, edge + 90).map((p) => Object.assign(p, { s: 14 + R() * 10, sy: 12 + R() * 16 })), {});
      // canyon chasm walls under gaps
      instances(W, 'flag', scatter(N(12), hw + SH + 1, hw + SH + 2), {}); clouds(); break; }
    case 'candy': {
      instances(W, 'lollipop', sz(scatter(N(50), edge, edge + 30), 0.9, 1.6), { gloss: true }); instances(W, 'cane', sz(scatter(N(50), edge, edge + 25), 0.9, 1.4), { gloss: true });
      instances(W, 'gumdrop', scatter(N(70), edge, edge + 40).map((p) => Object.assign(p, { s: 0.8 + R() * 1.5, c: [0xff4fd8, 0x7cff6b, 0xffe14d, 0x3ff0ff, 0xb26bff, 0xff7a3d][(R() * 6) | 0] })), { gloss: true });
      instances(W, 'cupcake', sz(scatter(N(18), edge + 8, edge + 60), 2.5, 4.5), { gloss: true }); instances(W, 'donut', sz(scatter(N(20), edge + 5, edge + 50), 1.5, 3), { gloss: true });
      instances(W, 'cupcake', ring(N(16), 50, 200).map((p) => Object.assign(p, { s: 10 + R() * 10 })), { gloss: true, shadow: false });
      instances(W, 'gumdrop', ring(N(20), 40, 220).map((p) => Object.assign(p, { s: 14 + R() * 18, c: [0xff4fd8, 0x7cff6b, 0xffe14d, 0x3ff0ff, 0xb26bff][(R() * 5) | 0] })), { gloss: true, shadow: false });
      clouds(0xffe0f5); break; }
    case 'beach': {
      instances(W, 'palm', sz(scatter(N(70), edge, edge + 30), 0.9, 1.4), {}); instances(W, 'umbrella', scatter(N(30), edge, edge + 20), {}); instances(W, 'beachball', sz(scatter(N(20), edge, edge + 15), 0.6, 0.9), { gloss: true });
      instances(W, 'sandcastle', sz(scatter(N(12), edge + 2, edge + 25), 0.8, 1.4), {}); instances(W, 'tower', scatter(1, edge + 30, edge + 40), {});
      // ocean with animated cartoon waves
      const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 1, 1), waterMat(0x00b7ff, 0x7ff6ff)); water.rotation.x = -PI / 2; water.position.y = baseY + 0.05; W.grp.add(water);
      // sand island under the track (ground plane drawn above water inside an ellipse)
      W.grp.children.forEach((m) => { if (m.geometry && m.geometry.type === 'PlaneGeometry' && m !== water && m.material === groundMaterial('sand')) m.visible = false; });
      const isl = new THREE.Mesh(new THREE.CircleGeometry(1, 96), groundMaterial('sand')); let cx = 0, cz = 0, mr = 0; for (let i = 0; i < D.N; i++) { cx += D.X[i]; cz += D.Z[i]; } cx /= D.N; cz /= D.N; for (let i = 0; i < D.N; i++) mr = Math.max(mr, Math.hypot(D.X[i] - cx, D.Z[i] - cz));
      isl.scale.setScalar(mr + 70); isl.rotation.x = -PI / 2; isl.position.set(cx, baseY + 0.12, cz); isl.receiveShadow = true; const iu = isl.geometry.attributes.uv; for (let k = 0; k < iu.count; k++) iu.setXY(k, iu.getX(k) * 25, iu.getY(k) * 25); W.grp.add(isl);
      W.anim.push((dt, t) => { water.material.uniforms.t.value = t; }); clouds(); break; }
    case 'haunted': {
      instances(W, 'deadtree', sz(scatter(N(60), edge, edge + 35), 0.9, 1.5), {}); instances(W, 'tomb', sz(scatter(N(70), edge, edge + 25), 0.8, 1.3), {}); instances(W, 'pumpkin', sz(scatter(N(40), edge, edge + 15), 0.7, 1.3), { gloss: true });
      instances(W, 'lantern', scatter(N(36), hw + SH + 1.2, hw + SH + 1.8), {}); instances(W, 'castletower', ring(N(10), 30, 120).map((p) => Object.assign(p, { s: 1.6 + R() * 1.2 })), {});
      instances(W, 'castletower', scatter(N(6), edge + 25, edge + 60).map((p) => Object.assign(p, { s: 0.9 + R() * 0.5 })), {});
      instances(W, 'bush', scatter(N(40), edge, edge + 30).map((p) => Object.assign(p, { c: 0x5b8f7a })), {}); break; }
    case 'snow': {
      instances(W, 'pine', sz(scatter(N(110), edge, edge + 45), 0.9, 1.7), {}); instances(W, 'snowman', sz(scatter(N(14), edge, edge + 20), 0.9, 1.2), {}); instances(W, 'crystal', sz(scatter(N(30), edge, edge + 30), 0.8, 1.6), { gloss: true });
      instances(W, 'mountain', ring(N(24), 50, 220).map((p) => Object.assign(p, { s: 50 + R() * 50, sy: 40 + R() * 60 })), { shadow: false });
      const ice = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 })); const sp = scatter(1, edge + 30, edge + 40)[0]; if (sp) { ice.rotation.x = -PI / 2; ice.position.set(sp.x, baseY + 0.02, sp.z); W.grp.add(ice); }
      clouds(); break; }
    case 'volcano': {
      instances(W, 'basalt', sz(scatter(N(70), edge, edge + 40), 0.8, 2.2), {}); instances(W, 'lavacrystal', sz(scatter(N(40), edge, edge + 25), 0.8, 1.6), {});
      const lava = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 1, 1), lavaMat()); lava.rotation.x = -PI / 2; lava.position.y = baseY - 0.1; W.grp.add(lava); W.lavaY = baseY;
      W.grp.children.forEach((m) => { if (m.geometry && m.geometry.type === 'PlaneGeometry' && m !== lava && m.material === groundMaterial('ash')) m.visible = false; });
      instances(W, 'volcanoCone', ring(1, 120, 140).map((p) => Object.assign(p, { s: 160, sy: 110 })), { shadow: false });
      instances(W, 'basalt', ring(N(30), 40, 200).map((p) => Object.assign(p, { s: 15 + R() * 20, sy: 10 + R() * 25 })), { shadow: false });
      W.anim.push((dt, t) => { lava.material.uniforms.t.value = t; }); break; }
    case 'lab': { // Ratita Labs: science campus, cheese silos, neon arches
      const tint = [0xffffff, 0xe0f7ff, 0xffe9f5, 0xfff6cc, 0xe9e3ff];
      const tw = scatter(N(46), edge + 16, edge + 80); tw.forEach((p) => { p.s = 9 + R() * 6; p.sy = 18 + R() * 42; p.c = tint[(R() * 5) | 0]; p.ry = Math.round(p.ry / (PI / 2)) * PI / 2; }); instances(W, 'labtower', tw, { gloss: true });
      const face = (l) => l.map((p) => { p.ry = Math.atan2(D.X[p.i] - p.x, D.Z[p.i] - p.z); return p; });
      instances(W, 'labdome', sz(face(scatter(N(10), edge + 14, edge + 50)), 0.8, 1.25), { gloss: true });
      instances(W, 'cheesesilo', sz(scatter(N(24), edge + 6, edge + 36), 0.8, 1.3), { gloss: true });
      instances(W, 'testtube', sz(scatter(N(48), edge, edge + 12), 0.8, 1.4), { gloss: true });
      instances(W, 'tesla', sz(scatter(N(22), edge + 1, edge + 18), 0.85, 1.25), { gloss: true });
      instances(W, 'ratstatue', sz(face(scatter(N(5), edge + 10, edge + 30)), 0.9, 1.2), { gloss: true });
      instances(W, 'robotarm', sz(scatter(N(26), edge, edge + 10), 0.9, 1.3), { gloss: true });
      instances(W, 'dish', sz(scatter(N(10), edge + 4, edge + 30), 1.0, 1.6), { gloss: true });
      instances(W, 'cheesewheel', sz(scatter(N(46), edge, edge + 16), 0.7, 1.4), { gloss: true });
      instances(W, 'labcrate', sz(scatter(N(56), edge, edge + 12), 0.8, 1.4), { gloss: true });
      instances(W, 'neonpost', face(scatter(N(54), hw + SH + 1.2, hw + SH + 1.8)), { gloss: true });
      instances(W, 'bush', scatter(N(70), edge, edge + 22).map((p) => Object.assign(p, { c: [0x7cf7d4, 0xffb3e0, 0xb9a8ff][(R() * 3) | 0] })), {});
      instances(W, 'labtowerFar', ring(N(44), 70, 260).map((p) => Object.assign(p, { s: 16 + R() * 14, sy: 40 + R() * 100, c: [0xd7ccff, 0xffd1ec, 0xc7f5ff][(R() * 3) | 0] })), { shadow: false });
      neonArches(W, D, hw); clouds(0xffd6f0, 12); break; }
    case 'garden': { // Torty's Garden: giant sunflowers, veggies, picket fences, a Torty topiary
      instances(W, 'sunflower', sz(scatter(N(120), edge, edge + 28), 0.85, 1.45), {});
      instances(W, 'mushroom', sz(scatter(N(40), edge + 1, edge + 24), 0.8, 1.7), { gloss: true });
      instances(W, 'carrot', sz(scatter(N(36), edge, edge + 18), 0.8, 1.4), {}); instances(W, 'lettuce', sz(scatter(N(46), edge, edge + 16), 0.8, 1.5), {});
      instances(W, 'flowerbed', sz(scatter(N(70), edge, edge + 14), 0.8, 1.3), {}); instances(W, 'gnome', sz(scatter(N(22), edge, edge + 14).map((p) => { p.ry = Math.atan2(D.X[p.i] - p.x, D.Z[p.i] - p.z); return p; }), 1.0, 1.5), { gloss: true });
      instances(W, 'fence', scatter(N(60), edge - 1.2, edge - 0.4).map((p) => { p.ry = Math.atan2(-D.TZ[p.i], D.TX[p.i]); return p; }), {});
      instances(W, 'greenhouse', sz(scatter(N(4), edge + 16, edge + 40), 1.0, 1.3), { gloss: true });
      instances(W, 'topiary', sz(scatter(N(5), edge + 8, edge + 28).map((p) => { p.ry = Math.atan2(D.X[p.i] - p.x, D.Z[p.i] - p.z); return p; }), 1.0, 1.4), {});
      instances(W, 'wateringcan', sz(scatter(N(7), edge + 6, edge + 30), 1.6, 2.6), { gloss: true }); instances(W, 'potplant', sz(scatter(N(26), edge, edge + 14), 0.8, 1.3), { gloss: true });
      instances(W, 'butterflies', scatter(N(26), edge, edge + 20).map((p) => Object.assign(p, { y: p.y + R() * 2 })), { shadow: false });
      instances(W, 'tree', sz(scatter(N(40), edge + 10, edge + 50), 1.0, 1.6), {}); instances(W, 'bush', sz(scatter(N(70), edge, edge + 22), 0.8, 1.4), {});
      instances(W, 'hill', ring(N(30), 40, 240).map((p) => Object.assign(p, { s: 50 + R() * 50, sy: 18 + R() * 30 })), { shadow: false });
      instances(W, 'sunflower', ring(N(24), 20, 60).map((p) => Object.assign(p, { s: 3 + R() * 2 })), { shadow: false });
      clouds(); break; }
    case 'space': {
      instances(W, 'asteroid', scatter(N(70), edge, edge + 60, 'float').map((p) => Object.assign(p, { s: 1.5 + R() * 4, rx: R() * 6, rz: R() * 6 })), {});
      instances(W, 'pylon', scatter(N(30), hw + 2.5, hw + 3.5, 'float').map((p) => { const ny = nearestY(D, p.x, p.z); p.y = ny.y - 3; return p; }), {});
      // planets
      const pl = [[0xff7ab6, 0xffd6ec, 60, true], [0x5b8cff, 0x9ff3ff, 40, false], [0xffb000, 0xffe9a8, 26, true], [0x7cff6b, 0xe0ffd0, 18, false]];
      pl.forEach(([c1, c2, r, ring2], k) => { const tex = canvasTex('planet' + k, 512, (g, S) => { for (let y = 0; y < S; y += 8) { const t = Math.sin(y * 0.05 + k) * 0.5 + 0.5; g.fillStyle = new THREE.Color(c1).lerp(new THREE.Color(c2), t).getStyle(); g.fillRect(0, y, S, 8); } });
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: c1, emissiveIntensity: 0.15 })); const a = k * 1.7 + 0.5, d = 420 + k * 60; m.position.set(Math.cos(a) * d, 60 + k * 35, Math.sin(a) * d); m.rotation.z = 0.4; W.grp.add(m);
        if (ring2) { const rg = new THREE.Mesh(new THREE.RingGeometry(r * 1.4, r * 2.1, 96), new THREE.MeshStandardMaterial({ color: c2, side: THREE.DoubleSide, transparent: true, opacity: 0.75, emissive: c2, emissiveIntensity: 0.3 })); rg.rotation.x = PI / 2 - 0.35; m.add(rg); }
        W.anim.push((dt) => { m.rotation.y += dt * 0.05; }); });
      break; }
  }
}

// glowing hoops over the road (one merged draw call), skipping the start gate, gaps and shortcut mouths
function neonArches(W, D, hw) {
  const b = new Builder(); const half = new THREE.TorusGeometry(hw + 2.2, 0.32, 10, 48, PI);
  for (let s = 40; s < D.L - 30; s += 46) { const i = D.uIdx(s / D.L); if (D.GAP[i] || D.VOID[i]) continue; const p = pointAt(D, s, 0); const k = Math.round(s / 46);
    b.add(half, k % 2 ? 0x22e5ff : 0xff4fd8, p.x, p.y - 0.4, p.z, 0, p.yaw, 0, 1, 1, 1, 1.4); }
  if (!b.parts.length) return; const m = new THREE.Mesh(b.build(), vcMaterial(true)); m.castShadow = false; m.receiveShadow = false; W.grp.add(m);
}
export function waterMat(c1, c2) {
  return new THREE.ShaderMaterial({ fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: 0 }, c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) } }]),
    vertexShader: '#include <fog_pars_vertex>\nvarying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: '#include <fog_pars_fragment>\nuniform float t; uniform vec3 c1, c2; varying vec3 vW; void main(){ vec2 p = vW.xz*0.06; float w = sin(p.x*3.+t*1.3)*sin(p.y*2.7-t*1.1) + sin((p.x+p.y)*5.+t*2.)*0.5; float f = smoothstep(0.7,1.2,w); vec3 c = mix(c1, c2, 0.25+0.25*w); c = mix(c, vec3(1.), f*0.7); gl_FragColor = vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>\n}' });
}
export function lavaMat() {
  return new THREE.ShaderMaterial({ fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: 0 } }]),
    vertexShader: '#include <fog_pars_vertex>\nvarying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: '#include <fog_pars_fragment>\nuniform float t; varying vec3 vW; float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);} float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);} void main(){ vec2 p = vW.xz*0.05; float v = n(p*2.+vec2(t*0.15,0.))*0.6+n(p*5.-vec2(0.,t*0.2))*0.4; vec3 c = mix(vec3(1.0,0.25,0.0), vec3(1.6,0.95,0.2), smoothstep(0.45,0.75,v)); c = mix(vec3(0.35,0.06,0.02), c, smoothstep(0.25,0.45,v)); gl_FragColor = vec4(c*1.3,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>\n}' });
}
