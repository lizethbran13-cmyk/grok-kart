// Track geometry (spline ribbon with banking) + fast surface queries for physics.
import * as THREE from 'three';
import { clamp, lerp } from './util.js';

export const SH = 11; // shoulder width beyond the road edge (to the wall)

export function buildTrackData(T) {
  const s = T.scale || 1;
  const curve = new THREE.CatmullRomCurve3(T.pts.map((p) => new THREE.Vector3(p[0] * s, p[2], p[1] * s)), true, 'centripetal');
  const L0 = curve.getLength();
  const N = Math.round(L0 / 2);
  const pts = curve.getSpacedPoints(N); pts.pop();
  const hw = T.width / 2;
  const X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N), TX = new Float32Array(N), TZ = new Float32Array(N), S = new Float32Array(N + 1), BK = new Float32Array(N), GAP = new Uint8Array(N), VOID = new Uint8Array(N), SLOPE = new Float32Array(N);
  for (let i = 0; i < N; i++) { X[i] = pts[i].x; Y[i] = pts[i].y; Z[i] = pts[i].z; }
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = (i - 1 + N) % N, b = (i + 1) % N;
    let tx = X[b] - X[a], tz = Z[b] - Z[a]; const l = Math.hypot(tx, tz) || 1; TX[i] = tx / l; TZ[i] = tz / l;
    S[i] = acc; const j = (i + 1) % N; acc += Math.hypot(X[j] - X[i], Z[j] - Z[i], Y[j] - Y[i]);
    SLOPE[i] = (Y[b] - Y[a]) / (Math.hypot(X[b] - X[a], Z[b] - Z[a]) || 1);
  }
  S[N] = acc; const L = acc;
  // banking from signed curvature, smoothed
  const raw = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = (i - 4 + N) % N, b = (i + 4) % N;
    let da = Math.atan2(TZ[b], TX[b]) - Math.atan2(TZ[a], TX[a]); while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    raw[i] = da / 16; // rad per meter
  }
  for (let i = 0; i < N; i++) { let sm = 0; for (let k = -6; k <= 6; k++) sm += raw[(i + k + N) % N]; BK[i] = clamp(-(sm / 13) * 9, -0.16, 0.16); }
  const uIdx = (u) => (Math.round(((u % 1) + 1) % 1 * N)) % N;
  (T.gaps || []).forEach(([u0, u1]) => { for (let i = uIdx(u0); i !== uIdx(u1); i = (i + 1) % N) GAP[i] = 1; });
  (T.voids || []).forEach(([u0, u1]) => { if (u1 - u0 >= 1) VOID.fill(1); else for (let i = uIdx(u0); i !== uIdx(u1); i = (i + 1) % N) VOID[i] = 1; });
  for (let i = 0; i < N; i++) if (GAP[i]) { VOID[i] = 1; BK[i] = 0; }
  const D = { T, N, L, hw, X, Y, Z, TX, TZ, S, BK, GAP, VOID, SLOPE, curve, uIdx, branches: [] };
  // shortcuts: a straight-ish dirt branch between two points on the main line
  (T.shortcuts || []).forEach((sc) => {
    const i0 = uIdx(sc.u0), i1 = uIdx(sc.u1);
    const a = new THREE.Vector3(X[i0], Y[i0], Z[i0]), b = new THREE.Vector3(X[i1], Y[i1], Z[i1]);
    const mid = a.clone().lerp(b, 0.5); const dir = b.clone().sub(a); const nrm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    mid.addScaledVector(nrm, sc.bulge || 0);
    // entry/exit tangent to the main road for smooth joins
    const a2 = a.clone().add(new THREE.Vector3(TX[i0], 0, TZ[i0]).multiplyScalar(14)), b2 = b.clone().sub(new THREE.Vector3(TX[i1], 0, TZ[i1]).multiplyScalar(14));
    const bc = new THREE.CatmullRomCurve3([a, a2, mid, b2, b], false, 'centripetal');
    const bl = bc.getLength(), bn = Math.max(8, Math.round(bl / 2)); const bp = bc.getSpacedPoints(bn);
    const br = { i0, i1, s0: S[i0], s1: S[i1], hw: 4.2, n: bp.length, X: new Float32Array(bp.length), Y: new Float32Array(bp.length), Z: new Float32Array(bp.length), len: bl, boost: !!sc.boost };
    bp.forEach((p, k) => { br.X[k] = p.x; br.Y[k] = p.y; br.Z[k] = p.z; });
    D.branches.push(br);
  });
  return D;
}

// nearest sample search; hint keeps it O(1) and handles overpasses
export function nearest(D, x, z, hint) {
  const N = D.N, X = D.X, Z = D.Z;
  let best = -1, bd = 1e18;
  if (hint == null || hint < 0) {
    for (let i = 0; i < N; i += 2) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < bd) { bd = d; best = i; } }
  } else best = hint;
  // walk to local minimum
  for (let it = 0; it < 80; it++) {
    const a = (best + 1) % N, b = (best - 1 + N) % N;
    const d0 = (X[best] - x) ** 2 + (Z[best] - z) ** 2, da = (X[a] - x) ** 2 + (Z[a] - z) ** 2, db = (X[b] - x) ** 2 + (Z[b] - z) ** 2;
    if (da < d0 && da <= db) best = a; else if (db < d0) best = b; else break;
  }
  return best;
}

// full surface query -> writes into out
export function query(D, x, z, hint, out) {
  const N = D.N;
  let i = nearest(D, x, z, hint);
  // pick segment i->i+1 or i-1->i
  const j = (i + 1) % N, p = (i - 1 + N) % N;
  let dx = x - D.X[i], dz = z - D.Z[i];
  let along = dx * D.TX[i] + dz * D.TZ[i];
  let i0 = i, i1 = j;
  if (along < 0) { i0 = p; i1 = i; dx = x - D.X[p]; dz = z - D.Z[p]; }
  const sx = D.X[i1] - D.X[i0], sz = D.Z[i1] - D.Z[i0]; const sl2 = sx * sx + sz * sz || 1;
  const f = clamp((dx * sx + dz * sz) / sl2, 0, 1);
  const cx = D.X[i0] + sx * f, cz = D.Z[i0] + sz * f, cy = lerp(D.Y[i0], D.Y[i1], f);
  const tx = lerp(D.TX[i0], D.TX[i1], f), tz = lerp(D.TZ[i0], D.TZ[i1], f); const tl = Math.hypot(tx, tz) || 1;
  const rx = -tz / tl, rz = tx / tl;
  const lat = (x - cx) * rx + (z - cz) * rz;
  const bank = lerp(D.BK[i0], D.BK[i1], f);
  const hw = D.hw;
  const sAt = D.S[i0] + (D.S[i0 + 1] - D.S[i0]) * f;
  const gap = D.GAP[i0] && D.GAP[i1], vd = D.VOID[i0] || D.VOID[i1];
  out.i = i; out.s = sAt; out.lat = lat; out.tx = tx / tl; out.tz = tz / tl;
  out.cx = cx; out.cz = cz; out.bank = bank; out.slope = lerp(D.SLOPE[i0], D.SLOPE[i1], f);
  const clat = clamp(lat, -hw, hw);
  out.y = cy + clat * Math.tan(bank);
  out.cy = cy;
  out.road = Math.abs(lat) <= hw; out.curb = Math.abs(lat) > hw - 1.2 && Math.abs(lat) <= hw + 0.3;
  out.solid = true; out.wall = false; out.surf = out.road ? 'road' : 'off'; out.branch = -1;
  if (gap) { out.solid = false; out.road = false; out.surf = 'air'; }
  else if (vd) { if (Math.abs(lat) > hw + 0.6) { out.solid = false; out.surf = 'air'; } }
  else if (Math.abs(lat) > hw + SH) out.wall = true;
  // shortcut branches override
  for (let b = 0; b < D.branches.length; b++) {
    const br = D.branches[b]; let bi = -1, bd = 1e18;
    for (let k = 0; k < br.n; k++) { const d = (br.X[k] - x) ** 2 + (br.Z[k] - z) ** 2; if (d < bd) { bd = d; bi = k; } }
    if (Math.sqrt(bd) < br.hw + 0.5 && !out.road) {
      out.branch = b; out.wall = false; out.solid = true; out.surf = 'dirt'; out.y = br.Y[bi]; out.road = false;
      out.bfrac = bi / (br.n - 1); out.bi = bi;
    } else if (Math.sqrt(bd) < br.hw + 2.5 && out.wall) out.wall = false;
  }
  return out;
}

// point on track: s (meters) + lateral -> world position
export function pointAt(D, s, lat, out) {
  s = ((s % D.L) + D.L) % D.L;
  let lo = 0, hi = D.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D.S[m] <= s) lo = m; else hi = m; }
  const i0 = lo, i1 = (lo + 1) % D.N; const f = (s - D.S[lo]) / ((D.S[lo + 1] - D.S[lo]) || 1);
  const tx = lerp(D.TX[i0], D.TX[i1], f), tz = lerp(D.TZ[i0], D.TZ[i1], f), tl = Math.hypot(tx, tz) || 1;
  const cx = lerp(D.X[i0], D.X[i1], f), cz = lerp(D.Z[i0], D.Z[i1], f), cy = lerp(D.Y[i0], D.Y[i1], f);
  const rx = -tz / tl, rz = tx / tl; const bank = lerp(D.BK[i0], D.BK[i1], f);
  out = out || {};
  out.x = cx + rx * lat; out.z = cz + rz * lat; out.y = cy + clamp(lat, -D.hw, D.hw) * Math.tan(bank);
  out.tx = tx / tl; out.tz = tz / tl; out.rx = rx; out.rz = rz; out.i = i0; out.bank = bank; out.cy = cy;
  out.yaw = Math.atan2(out.tx, out.tz);
  return out;
}

/* ---------- mesh building ---------- */
// generic swept ribbon: for each sample, list of [lat, dy] profile points -> triangle strip grid
export function sweep(D, profileFn, opts = {}) {
  const N = D.N, idx = [], pos = [], uv = [], col = [];
  const range = opts.range || null; // [i0, count]
  const count = range ? range[1] : N + 1; const start = range ? range[0] : 0;
  let P0 = null;
  for (let k = 0; k < count; k++) {
    const i = (start + k) % N;
    const prof = profileFn(i, k);
    if (!P0) P0 = prof.length;
    const rx = -D.TZ[i], rz = D.TX[i], tb = Math.tan(D.BK[i]);
    const sv = (start + k >= N ? D.L + D.S[i] : D.S[i]);
    for (let m = 0; m < prof.length; m++) {
      const [lat, dy, u, c] = prof[m];
      const bl = clamp(lat, -D.hw, D.hw);
      pos.push(D.X[i] + rx * lat, D.Y[i] + bl * tb + dy, D.Z[i] + rz * lat);
      uv.push(u != null ? u : lat, sv / (opts.vScale || 8));
      if (opts.colors) { const cc = c || [1, 1, 1]; col.push(cc[0], cc[1], cc[2]); }
    }
  }
  for (let k = 0; k < count - 1; k++) for (let m = 0; m < P0 - 1; m++) {
    const a = k * P0 + m, b = a + 1, c = a + P0, d = c + 1;
    if (opts.skip && opts.skip((start + k) % N, m)) continue;
    if (opts.flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (opts.colors) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// contiguous index runs where pred(i) is true (wrap-aware) -> [[start, count], ...]
export function runs(D, pred) {
  const N = D.N, out = []; let allTrue = true;
  for (let i = 0; i < N; i++) if (!pred(i)) { allTrue = false; break; }
  if (allTrue) return [[0, N + 1]];
  let s0 = 0; while (pred(s0)) s0++;
  let i = s0, cur = null;
  for (let k = 0; k <= N; k++, i = (i + 1) % N) {
    if (pred(i)) { if (!cur) cur = [i, 0]; cur[1]++; } else if (cur) { cur[1]++; out.push(cur); cur = null; }
  }
  if (cur) { cur[1]++; out.push(cur); }
  return out;
}

export function minimap(D) {
  let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9;
  for (let i = 0; i < D.N; i++) { minx = Math.min(minx, D.X[i]); maxx = Math.max(maxx, D.X[i]); minz = Math.min(minz, D.Z[i]); maxz = Math.max(maxz, D.Z[i]); }
  const sc = 190 / Math.max(maxx - minx, maxz - minz);
  const ox = 110 - (minx + maxx) / 2 * sc, oz = 110 - (minz + maxz) / 2 * sc;
  return { sc, ox, oz };
}
