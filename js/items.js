// Items, item orbs, coins and track hazards (pure simulation; rendering lives in view.js).
import { ITEM_ODDS, BATTLE_ODDS } from './data.js';
import { pointAt, query, SH } from './track.js';
import { hitKart, surf } from './kart.js';
import { clamp, wrapAng } from './util.js';

let EID = 1;
function pick(odds, r) { let tot = 0; for (const k in odds) tot += odds[k]; let x = r() * tot; for (const k in odds) { x -= odds[k]; if (x <= 0) return k; } return Object.keys(odds)[0]; }

export function setupEntities(race) {
  const w = race.world; race.ents = []; race.boxes = []; race.coinsW = []; race.hazards = [];
  if (w.arena) { w.arena.boxes.forEach(([x, z]) => race.boxes.push({ x, y: 1.2, z, t: 0 })); return; }
  const D = w.D, T = D.T;
  if (race.mode !== 'tt') (T.items || []).forEach((u) => { [-0.62, -0.21, 0.21, 0.62].forEach((f) => { const p = pointAt(D, u * D.L, f * D.hw); race.boxes.push({ x: p.x, y: p.y + 1.3, z: p.z, t: 0 }); }); });
  (T.coins || []).forEach((c) => { for (let i = 0; i < c.n; i++) { const p = pointAt(D, c.u * D.L + i * 3.2, c.off * D.hw * 0.7); race.coinsW.push({ x: p.x, y: p.y + 0.9, z: p.z, t: 0 }); } });
  (T.hazards || []).forEach((h, i) => { const p = pointAt(D, h.u * D.L, (h.off || 0) * D.hw); race.hazards.push(Object.assign({ id: i, x: p.x, y: p.y, z: p.z, s: h.u * D.L, lat: (h.off || 0) * D.hw, ph: i * 1.7, r: 1.4, on: true, yaw: p.yaw }, h)); });
}

export function rollItem(race, k) {
  if (race.mode === 'battle') return pick(BATTLE_ODDS, race.rand);
  if (race.mode === 'tt') return 'turbo';
  const n = race.karts.length; const rank = (k.place - 1) / Math.max(1, n - 1);
  // distance behind the leader matters too
  const lead = Math.max(...race.karts.map((o) => o.prog)); const gap = lead - k.prog;
  let b = rank < 0.15 ? 0 : rank < 0.5 ? 1 : rank < 0.8 ? 2 : 3; if (gap > 250) b = 3; else if (gap > 120) b = Math.max(b, 2);
  return pick(ITEM_ODDS[b], race.rand);
}

export function stepItems(race, dt) {
  const w = race.world, ks = race.karts;
  // orbs
  for (const b of race.boxes) {
    if (b.t > 0) { b.t -= dt; continue; }
    for (const k of ks) { if (k.respawn > 0 || k.out) continue; if ((k.x - b.x) ** 2 + (k.z - b.z) ** 2 < 4.4 && Math.abs(k.y + 0.8 - b.y) < 2.6) { b.t = 1.6; race.fx('orb', b.x, b.y, b.z); if (!k.item && k.roulette <= 0) { k.roulette = race.mode === 'tt' ? 0.01 : 1.1; k.rouletteItem = rollItem(race, k); k.events.push('orb'); } break; } }
  }
  // coins
  for (const c of race.coinsW) {
    if (c.t > 0) { c.t -= dt; continue; }
    for (const k of ks) { if (k.respawn > 0 || k.out) continue; const r2 = k.magnet > 0 ? 100 : 3.4; if ((k.x - c.x) ** 2 + (k.z - c.z) ** 2 < r2 && Math.abs(k.y + 0.6 - c.y) < 2.5) { c.t = c.respawn === false ? 1e9 : race.mode === 'coins' ? 6 : 9; k.coins++; k.coinsTotal++; k.events.push('coin'); race.fx('coin', c.x, c.y, c.z); break; } }
  }
  // roulette + use
  for (const k of ks) {
    if (k.roulette > 0) { k.roulette -= dt; if (k.roulette <= 0) { k.roulette = 0; k.item = k.rouletteItem; k.itemQty = k.item === 'turbo3' ? 3 : 1; k.events.push('itemready'); } }
    if (k.pressItem) { k.pressItem = false; if (k.item && k.respawn <= 0 && k.spin <= 0 && k.tumble <= 0 && !k.out) useItem(race, k); }
  }
  // entities
  for (let i = race.ents.length - 1; i >= 0; i--) { const e = race.ents[i]; stepEnt(race, e, dt); if (e.dead) race.ents.splice(i, 1); }
  // nova bumps + squash shrunk karts
  for (let a = 0; a < ks.length; a++) for (let b = 0; b < ks.length; b++) { if (a === b) continue; const A = ks[a], B = ks[b];
    if ((A.x - B.x) ** 2 + (A.z - B.z) ** 2 > 4.4 || Math.abs(A.y - B.y) > 2) continue;
    if (A.nova > 0 && B.nova <= 0) hitKart(B, 'spin', a) && race.onHit(B, A);
    else if (B.shrink > 0 && A.shrink <= 0 && A.speed > 10) hitKart(B, 'squash', a) && race.onHit(B, A); }
  stepHazards(race, dt);
}

function forwardOf(k) { return { fx: Math.sin(k.yaw), fz: Math.cos(k.yaw) }; }
function useItem(race, k) {
  const it = k.item; const { fx, fz } = forwardOf(k); const idx = race.karts.indexOf(k);
  const consume = () => { k.itemQty--; if (k.itemQty <= 0) { k.item = null; k.itemQty = 0; } };
  k.events.push('use_' + it);
  switch (it) {
    case 'turbo': case 'turbo3': k.boost = Math.max(k.boost, 1.35); k.boostLvl = 3; consume(); break;
    case 'slime': race.ents.push({ id: EID++, type: 'slime', x: k.x - fx * 3, y: k.y, z: k.z - fz * 3, vx: 0, vz: 0, vy: 0, life: 40, owner: idx, r: 1.3, arm: 0.4 }); consume(); break;
    case 'puck': { const sp = Math.max(k.speed + 22, 46); race.ents.push({ id: EID++, type: 'puck', x: k.x + fx * 2.6, y: k.y + 0.4, z: k.z + fz * 2.6, vx: fx * sp, vz: fz * sp, vy: 0, life: 7, owner: idx, r: 1.1, bounces: 0, arm: 0.12, hint: k.hint }); consume(); break; }
    case 'seeker': { // target: racer just ahead (or nearest in battle)
      let tgt = -1;
      if (race.mode === 'battle') { let bd = 1e9; race.karts.forEach((o, j) => { if (j === idx || o.out) return; const d = (o.x - k.x) ** 2 + (o.z - k.z) ** 2; if (d < bd) { bd = d; tgt = j; } }); }
      else { let best = 1e9; race.karts.forEach((o, j) => { if (j === idx || o.finished) return; const d = o.prog - k.prog; if (d > 0 && d < best) { best = d; tgt = j; } }); }
      race.ents.push({ id: EID++, type: 'seeker', x: k.x + fx * 2.6, y: k.y + 0.5, z: k.z + fz * 2.6, vx: fx * 40, vz: fz * 40, vy: 0, life: 9, owner: idx, r: 1.3, tgt, arm: 0.15, hint: k.hint, s: k.lastS }); consume(); break; }
    case 'boom': race.ents.push({ id: EID++, type: 'boom', x: k.x + fx * 2.5, y: k.y + 1.2, z: k.z + fz * 2.5, vx: fx * (k.speed + 16), vz: fz * (k.speed + 16), vy: 9, life: 4, owner: idx, r: 1.2, fuse: 1.6, landed: false, arm: 0.3 }); consume(); break;
    case 'shield': k.shield = 14; consume(); break;
    case 'nova': k.nova = 7; k.boost = Math.max(k.boost, 0.6); k.boostLvl = 3; consume(); break;
    case 'magnet': k.magnet = 5; k.coins += 3; k.coinsTotal += 3; consume(); break;
    case 'zap': race.karts.forEach((o, j) => { if (j === idx || o.out) return; if (race.mode !== 'battle' && o.prog <= k.prog) return; if (o.nova > 0) return; if (o.shield > 0) { o.shield = 0; o.events.push('shieldpop'); return; } o.shrink = 6; o.spin = Math.max(o.spin, 0.55); o.speed *= 0.6; o.events.push('zapped'); if (o.item && race.rand() < 0.5) { o.item = null; o.itemQty = 0; } }); race.flash('zap'); consume(); break;
    case 'splat': race.karts.forEach((o, j) => { if (j === idx) return; if (race.mode !== 'battle' && o.prog <= k.prog) return; if (o.nova > 0) return; o.splat = 4.5; o.events.push('splatted'); }); consume(); break;
    default: consume();
  }
}

function stepEnt(race, e, dt) {
  const w = race.world, ks = race.karts; e.life -= dt; if (e.arm > 0) e.arm -= dt;
  if (e.life <= 0) { e.dead = true; if (e.type === 'boom') explode(race, e); return; }
  const Q = {};
  if (e.type === 'puck' || e.type === 'seeker') {
    if (e.type === 'seeker' && e.tgt >= 0) { const t = ks[e.tgt];
      if (!t || t.finished || t.out) e.tgt = -1;
      else { let dx = t.x - e.x, dz = t.z - e.z; const d = Math.hypot(dx, dz);
        if (!w.arena && d > 22) { // follow the track centre line toward target
          const q = query(w.D, e.x, e.z, e.hint, Q); e.hint = q.i; const p = pointAt(w.D, q.s + 14, clamp(q.lat * 0.6, -3, 3)); dx = p.x - e.x; dz = p.z - e.z; }
        const l = Math.hypot(dx, dz) || 1, sp = 52; e.vx += (dx / l * sp - e.vx) * Math.min(1, dt * 5); e.vz += (dz / l * sp - e.vz) * Math.min(1, dt * 5); } }
    e.x += e.vx * dt; e.z += e.vz * dt;
    const q = w.arena ? w.arena.query(e.x, e.z, Q) : query(w.D, e.x, e.z, e.hint, Q); e.hint = q.i;
    if (!q.solid) { e.y -= 18 * dt; if (e.y < (q.cy || 0) - 12) e.dead = true; }
    else e.y += (q.y + 0.45 - e.y) * Math.min(1, dt * 12);
    if (q.wall) { // bounce off the boundary
      if (w.arena) w.arena.bounce(e, q); else { const s = Math.sign(q.lat), rx = -q.tz, rz = q.tx; const vn = e.vx * rx + e.vz * rz; if (vn * s > 0) { e.vx -= 2 * vn * rx; e.vz -= 2 * vn * rz; } const lim = w.D.hw + SH - 0.2; e.x = q.cx + rx * s * lim; e.z = q.cz + rz * s * lim; }
      e.bounces++; if (e.type === 'seeker') e.tgt = e.tgt; if (e.bounces > 8) e.dead = true; }
  } else if (e.type === 'boom') {
    if (!e.landed) { e.vy -= 26 * dt; e.x += e.vx * dt; e.z += e.vz * dt; e.y += e.vy * dt; const q = w.arena ? w.arena.query(e.x, e.z, Q) : query(w.D, e.x, e.z, e.hint, Q); e.hint = q.i; if (q.solid && e.y <= q.y + 0.6 && e.vy < 0) { e.landed = true; e.y = q.y + 0.6; e.vx = e.vz = 0; } if (!q.solid && e.y < (q.cy || 0) - 10) e.dead = true; }
    else { e.fuse -= dt; if (e.fuse <= 0) { e.dead = true; explode(race, e); return; } }
  } else if (e.type === 'slime') { if (e.vy) {} }
  // collisions with karts
  if (e.dead) return;
  for (let j = 0; j < ks.length; j++) { const k = ks[j]; if (k.respawn > 0 || k.out) continue; if (j === e.owner && e.arm > 0) continue;
    if ((k.x - e.x) ** 2 + (k.z - e.z) ** 2 < (e.r + 1.1) ** 2 && Math.abs(k.y + 0.5 - e.y) < 2.2) {
      if (e.type === 'boom') { e.dead = true; explode(race, e); return; }
      const hit = hitKart(k, 'spin', e.owner); if (hit) race.onHit(k, ks[e.owner]);
      if (k.nova <= 0 || e.type !== 'slime') { e.dead = true; race.fx('poof', e.x, e.y, e.z); }
      return; } }
  // projectiles destroy each other / slimes
  if (e.type === 'puck' || e.type === 'seeker') for (const o of race.ents) { if (o === e || o.dead) continue; if ((o.x - e.x) ** 2 + (o.z - e.z) ** 2 < (o.r + e.r) ** 2) { if (o.type === 'boom') { o.dead = true; explode(race, o); } else o.dead = true; e.dead = true; race.fx('poof', e.x, e.y, e.z); return; } }
}
function explode(race, e) {
  race.fx('boom', e.x, e.y, e.z); race.flash('boom', e);
  race.karts.forEach((k, j) => { if ((k.x - e.x) ** 2 + (k.z - e.z) ** 2 < 49 && Math.abs(k.y - e.y) < 5) { if (hitKart(k, 'tumble', e.owner)) race.onHit(k, race.karts[e.owner]); } });
}

// ---------- hazards ----------
export function hazardPos(race, h, t) {
  const D = race.world.D; if (!D) return h;
  const hw = D.hw;
  switch (h.type) {
    case 'car': { const s = h.s + t * 13; const lane = Math.sin(t * 0.21 + h.id) > 0 ? 0.42 : -0.42; const p = pointAt(D, s, lane * hw); h.x = p.x; h.y = p.y; h.z = p.z; h.yaw = p.yaw; h.r = 1.7; h.on = true; h.kind = 'spin'; break; }
    case 'boulder': case 'snowball': case 'ball': case 'tomato': { const per = 6.5; const ph = ((t + h.ph) % per) / per; const lat = (-1 + ph * 2) * (hw + SH * 0.6) * (h.id % 2 ? 1 : -1); const p = pointAt(D, h.s, lat); h.x = p.x; h.z = p.z; h.y = p.y; h.r = h.type === 'ball' || h.type === 'tomato' ? 1.5 : 2.0; h.roll = ph * 30; h.yaw = p.yaw; h.on = true; h.kind = h.type === 'ball' || h.type === 'tomato' ? 'spin' : 'tumble'; break; }
    case 'crab': case 'ghost': case 'robot': case 'snail': { const lat = Math.sin(t * (h.type === 'ghost' ? 0.9 : h.type === 'snail' ? 0.45 : 0.7) + h.ph) * hw * 0.85; const p = pointAt(D, h.s + Math.sin(t * 0.5 + h.ph) * 3, lat); h.x = p.x; h.z = p.z; h.y = p.y + (h.type === 'ghost' ? 1.0 + Math.sin(t * 3) * 0.3 : 0); h.yaw = p.yaw; h.r = h.type === 'ghost' ? 1.4 : 1.3; h.on = true; h.kind = 'spin'; break; }
    case 'sweeper': { const p = pointAt(D, h.s, 0); h.x = p.x; h.z = p.z; h.y = p.y; h.ang = t * 0.9 + h.ph; h.r = 1.6; h.on = true; h.kind = 'spin'; h.armLen = hw * 0.92; h.yaw = p.yaw; break; }
    case 'geyser': { const per = 5.5, ph = (t + h.ph) % per; h.warn = ph > 2.8 && ph < 3.8; h.on = ph >= 3.8 && ph < 5.2; h.erupt = h.on ? Math.sin((ph - 3.8) / 1.4 * Math.PI) : 0; const p = pointAt(D, h.s, h.lat); h.x = p.x; h.z = p.z; h.y = p.y; h.r = 2.3; h.kind = 'tumble'; break; }
    case 'ufo': { const lat = Math.sin(t * 0.6 + h.ph) * hw * 0.8; const p = pointAt(D, h.s, lat); h.x = p.x; h.z = p.z; h.y = p.y; h.r = 2.2; h.on = Math.sin(t * 1.3 + h.ph) > -0.2; h.kind = 'spin'; break; }
    default: { const p = pointAt(D, h.s, h.lat); h.x = p.x; h.z = p.z; h.y = p.y; h.r = h.type === 'cones' ? 1.6 : 1.5; h.on = true; h.kind = 'bump'; h.yaw = p.yaw; }
  }
  return h;
}
function stepHazards(race, dt) {
  const t = race.time;
  for (const h of race.hazards) {
    hazardPos(race, h, t);
    for (let j = 0; j < race.karts.length; j++) { const k = race.karts[j]; if (k.respawn > 0) continue;
      if (h.type === 'sweeper') { // rotating arm: distance from kart to arm segment
        const ax = Math.sin(h.ang), az = Math.cos(h.ang); const dx = k.x - h.x, dz = k.z - h.z; const t2 = clamp(dx * ax + dz * az, 0, h.armLen); const ex = dx - ax * t2, ez = dz - az * t2;
        if (ex * ex + ez * ez < 1.3 && Math.abs(k.y - h.y) < 2.5) { if (hitKart(k, 'spin')) race.onHit(k, null); }
        if (dx * dx + dz * dz < 2.6) pushOut(k, h, 1.6);
        continue; }
      if (!h.on) continue;
      const rr = h.r + 1.0; if ((k.x - h.x) ** 2 + (k.z - h.z) ** 2 < rr * rr && Math.abs(k.y + 0.5 - h.y - (h.type === 'ghost' ? 1 : 0)) < 3) {
        if (h.kind === 'bump') { pushOut(k, h, rr); if (k.speed > 6) { k.speed *= 0.55; k.events.push('bump'); } }
        else if (hitKart(k, h.kind)) race.onHit(k, null); else if (h.type === 'car' || h.type === 'boulder' || h.type === 'snowball') pushOut(k, h, rr);
      } }
  }
}
function pushOut(k, h, rr) { const dx = k.x - h.x, dz = k.z - h.z, d = Math.hypot(dx, dz) || 1; k.x = h.x + dx / d * rr; k.z = h.z + dz / d * rr; }
