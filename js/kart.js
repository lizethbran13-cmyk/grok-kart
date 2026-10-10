// Kart physics: arcade handling, drift mini-turbos, hops, ramps, tricks, gliding, walls, respawn.
import { query, pointAt, SH } from './track.js';
import { clamp, wrapAng, damp } from './util.js';

export const GRAV = 30;
export function makeKartState(o) {
  const st = o.stats || { spd: 3, acc: 3, han: 3, wt: 3 };
  return Object.assign({
    x: 0, y: 0, z: 0, yaw: 0, speed: 0, vside: 0, vy: 0, grounded: true, groundY: 0, hint: -1, steer: 0,
    prog: 0, lastS: 0, lap: 1, finished: false, finishTime: 0, place: 1, item: null, itemQty: 0, roulette: 0, rouletteItem: null, coins: 0, coinsTotal: 0,
    boost: 0, boostLvl: 0, driftDir: 0, driftCharge: 0, driftLvl: 0, driftVis: 0, hopT: 0, spin: 0, spinVis: 0, tumble: 0, shrink: 0, nova: 0, shield: 0, splat: 0, magnet: 0,
    glide: false, air: 0, launched: false, trick: false, trickVis: 0, trickAxis: 1, respawn: 0, invuln: 0, wrong: 0, stuck: 0, pitch: 0, roll: 0, bounce: 0,
    in: { steer: 0, gas: false, brake: false, drift: false, item: false }, prev: { drift: false, item: false },
    vmax: 28 + st.spd * 1.15, acc: 9 + st.acc * 2.3, turn: 1.55 + st.han * 0.11, wt: st.wt, cpuMul: 1, balloons: 3, out: false, hits: 0, lastHitBy: -1, events: [],
  }, o);
}
const Q = {};
export function surf(world, k, out) {
  if (world.arena) return world.arena.query(k.x, k.z, out);
  return query(world.D, k.x, k.z, k.hint, out);
}

export function stepKart(k, world, dt, race) {
  const inp = k.in;
  const pressDrift = inp.drift && !k.prev.drift, pressItem = inp.item && !k.prev.item;
  k.prev.drift = inp.drift; k.prev.item = inp.item; k.pressItem = k.pressItem || pressItem;
  for (const key of ['boost', 'spin', 'tumble', 'shrink', 'nova', 'shield', 'splat', 'magnet', 'invuln', 'hopT']) if (k[key] > 0) k[key] = Math.max(0, k[key] - dt);
  if (k.boost <= 0) k.boostLvl = 0;
  if (k.respawn > 0) { stepRespawn(k, world, dt); return; }
  const stunned = k.spin > 0 || k.tumble > 0;
  const q = surf(world, k, Q); k.hint = q.i;
  // ---- throttle ----
  let vmax = k.vmax * k.cpuMul * (1 + Math.min(10, k.coins) * 0.006);
  if (k.shrink > 0) vmax *= 0.8;
  const off = k.grounded && (q.surf === 'off');
  if (off && k.boost <= 0 && k.nova <= 0) vmax *= 0.52;
  if (q.surf === 'dirt' && k.boost <= 0) vmax *= 0.92;
  if (k.nova > 0) vmax *= 1.14;
  let target = 0, acc = k.acc * (1.25 - 0.85 * clamp(k.speed / vmax, 0, 1));
  if (!stunned && !race.frozen) { if (inp.gas) target = vmax; else if (inp.brake) target = -9; }
  if (k.boost > 0 && !stunned) { target = Math.max(target, vmax * (1.3 + 0.05 * k.boostLvl)); acc = 40; }
  if (race.frozen) target = 0;
  if (stunned) k.speed *= Math.exp(-2.6 * dt);
  else if (k.speed < target) k.speed = Math.min(target, k.speed + acc * dt * (k.grounded ? 1 : 0.3));
  else { const dec = inp.brake && k.speed > 0 ? 26 : (k.speed > vmax * 1.05 ? 9 : 6); k.speed = Math.max(target, k.speed - dec * dt * (k.grounded ? 1 : 0.2)); }
  // ---- steering ----
  const st = stunned ? 0 : clamp(inp.steer, -1, 1);
  k.steer = damp(k.steer, st, 12, dt);
  // hop + drift
  if (pressDrift && !stunned) {
    if (k.grounded && k.hopT <= 0 && k.speed > 8) { k.vy = 4.6; k.grounded = false; k.hopT = 0.35; k.hopping = true; }
    else if (!k.grounded && k.launched && !k.trick && k.air > 0.06 && !k.glide) { k.trick = true; k.trickVis = 0; k.trickAxis = Math.random() < 0.5 ? 1 : 2; k.events.push('trick'); }
  }
  if (k.driftDir === 0 && inp.drift && k.hopping && k.grounded && Math.abs(inp.steer) > 0.25 && k.speed > 10 && !stunned) { k.driftDir = Math.sign(inp.steer); k.driftCharge = 0; k.driftLvl = 0; }
  if (k.driftDir !== 0) {
    if (!inp.drift || k.speed < 8 || stunned || off) {
      if (k.driftLvl > 0 && !stunned) { const d = [0, 0.55, 1.0, 1.5][k.driftLvl]; k.boost = Math.max(k.boost, d); k.boostLvl = k.driftLvl; k.events.push('miniturbo'); }
      k.driftDir = 0; k.driftCharge = 0; k.driftLvl = 0;
    } else if (k.grounded) {
      k.driftCharge += dt * (0.7 + 0.75 * Math.max(0, inp.steer * k.driftDir + 0.3));
      const lv = k.driftCharge > 2.6 ? 3 : k.driftCharge > 1.6 ? 2 : k.driftCharge > 0.75 ? 1 : 0;
      if (lv > k.driftLvl) { k.driftLvl = lv; k.events.push('driftlvl'); }
    }
  }
  if (k.grounded && k.hopT <= 0) k.hopping = false;
  const sp = Math.abs(k.speed);
  let yawRate;
  if (k.driftDir !== 0) yawRate = k.driftDir * k.turn * (0.62 + 0.5 * (k.steer * k.driftDir));
  else yawRate = k.steer * k.turn * clamp(sp / 7, 0, 1) * (1 - 0.22 * clamp(sp / 40, 0, 1)) * (k.speed < 0 ? -1 : 1);
  if (!k.grounded) yawRate *= k.glide ? 0.75 : 0.55;
  if (k.tumble > 0) yawRate = 0;
  k.yaw = wrapAng(k.yaw - yawRate * dt); // + steer = right turn
  k.driftVis = damp(k.driftVis, -k.driftDir * 0.4, 8, dt);
  k.spinVis = k.spin > 0 ? k.spinVis + dt * 14 : (k.spinVis ? 0 : 0);
  if (k.trick) k.trickVis = Math.min(1, k.trickVis + dt * 2.4);
  // lateral slide decays; drifting pushes outward a bit
  const sideT = k.driftDir !== 0 ? -k.driftDir * sp * 0.06 : 0;
  k.vside = damp(k.vside, sideT, k.grounded ? 5 : 1, dt);
  const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = -fz, rz = fx;
  const px = k.x, pz = k.z;
  k.x += (fx * k.speed + rx * k.vside) * dt; k.z += (fz * k.speed + rz * k.vside) * dt;
  // ---- vertical ----
  const q2 = surf(world, k, Q); k.hint = q2.i;
  k.groundY = q2.solid ? q2.y : (world.lavaY != null ? world.lavaY : k.groundY); k.surfLast = q2.surf;
  if (k.grounded) {
    if (!q2.solid) { k.grounded = false; k.vy = 0; k.launched = false; }
    else {
      const dy = q2.y - k.y;
      if (dy < -0.9) { k.grounded = false; k.vy = Math.max(0, (k.slopePrev || 0)) * sp; k.launched = false; }
      else k.y = q2.y;
      k.slopePrev = q2.slope;
      // ramps / glide ramps / pads
      if (!world.arena && q2.road) rampCheck(k, world, q2, sp);
      if (world.arena && world.arena.rampAt(k.x, k.z, k.yaw) && sp > 8) { k.vy = 8 + sp * 0.1; k.grounded = false; k.launched = true; k.events.push('ramp'); }
      padCheck(k, world, q2);
    }
  }
  if (!k.grounded) {
    k.air += dt;
    k.vy -= GRAV * (k.glide ? 0.22 : 1) * dt; if (k.glide) k.vy = Math.max(k.vy, -4);
    k.y += k.vy * dt;
    if (q2.solid && k.y <= q2.y && k.vy <= 0) {
      if (k.y < q2.y - 2.5) { k.x = px; k.z = pz; k.speed *= 0.3; k.y = q2.y; } // hit a ledge from below
      k.y = q2.y; k.grounded = true;
      if (k.air > 0.25) { k.bounce = -0.25; k.events.push('land'); }
      if (k.trick) { k.boost = Math.max(k.boost, 0.9); k.boostLvl = Math.max(k.boostLvl, 2); k.events.push('trickboost'); }
      k.trick = false; k.trickVis = 0; k.glide = false; k.air = 0; k.launched = false; k.vy = 0;
    }
    const lowY = world.lavaY != null ? world.lavaY + 0.4 : (world.minY != null ? world.minY - 14 : -50);
    if (k.y < lowY || (!q2.solid && k.y < q2.cy - 10)) startRespawn(k, world, q2);
  } else k.air = 0;
  k.bounce = damp(k.bounce, 0, 10, dt);
  // ---- walls ----
  if (q2.wall) {
    const lim = (world.arena ? world.arena.lim : world.D.hw + SH) - 0.05;
    if (world.arena) world.arena.push(k, q2);
    else { const s = Math.sign(q2.lat); const rxx = -q2.tz, rzz = q2.tx; k.x = q2.cx + rxx * s * lim; k.z = q2.cz + rzz * s * lim;
      const into = (fx * rxx + fz * rzz) * s; // >0 = facing into wall
      if (into > 0) { k.speed *= 1 - 0.55 * into; const tyaw = Math.atan2(q2.tx, q2.tz); const d = wrapAng(tyaw - k.yaw); k.yaw = wrapAng(k.yaw + clamp(d, -0.5, 0.5) * 0.5); }
      k.vside = -s * 3; if (into > 0.25 && sp > 10) k.events.push('bump'); }
  }
  // ---- orientation (visual) ----
  const tp = k.grounded ? Math.atan(q2.slope || 0) * Math.cos(wrapAng(k.yaw - Math.atan2(q2.tx, q2.tz))) : clamp(k.vy * 0.03, -0.4, 0.4);
  k.pitch = damp(k.pitch, tp, 8, dt);
  k.roll = damp(k.roll, (k.grounded ? -(q2.bank || 0) * Math.cos(wrapAng(k.yaw - Math.atan2(q2.tx, q2.tz))) : 0) + k.driftDir * 0.06, 8, dt);
  // ---- progress ----
  if (!world.arena) progress(k, world, q2);
  // stuck detector (CPU/bot safety)
  if (Math.abs(k.speed) < 2 && inp.gas && !race.frozen && !stunned) k.stuck += dt; else k.stuck = Math.max(0, k.stuck - dt * 2);
}

function rampCheck(k, world, q, sp) {
  for (const r of world.W.ramps) {
    let ds = q.s - r.s0; if (ds < -world.D.L / 2) ds += world.D.L;
    const len = ((r.s1 - r.s0) + world.D.L) % world.D.L || 8;
    if (ds > len - 2.2 && ds < len + 1.2 && Math.abs(q.lat - r.lat) < r.hw + 0.3 && sp > 6) {
      if (r.glide) { k.vy = 12.5; k.glide = true; k.events.push('glide'); }
      else { k.vy = 7.5 + sp * 0.13; k.events.push('ramp'); }
      k.y += r.h * 0.5; k.grounded = false; k.launched = true; k.trick = false; return;
    }
    if (ds > 0 && ds < len) { const t = ds / len; k.y = Math.max(k.y, q.y + r.h * Math.pow(t, 1.4) * (Math.abs(q.lat - r.lat) < r.hw ? 1 : 0)); }
  }
}
function padCheck(k, world, q) {
  if (world.arena) return;
  for (const p of world.W.pads) { let ds = q.s - p.s; if (ds < -world.D.L / 2) ds += world.D.L; if (ds > -0.5 && ds < p.len && Math.abs(q.lat - p.lat) < p.hw) { if (k.boost < 0.9) k.events.push('pad'); k.boost = Math.max(k.boost, 1.1); k.boostLvl = Math.max(k.boostLvl, 2); } }
  for (const br of world.D.branches) if (br.pad && (k.x - br.pad.x) ** 2 + (k.z - br.pad.z) ** 2 < br.pad.r ** 2) { if (k.boost < 0.9) k.events.push('pad'); k.boost = Math.max(k.boost, 1.2); k.boostLvl = 2; }
}
export function progress(k, world, q) {
  const D = world.D; let s = q.s;
  if (q.branch >= 0) { const br = D.branches[q.branch]; let span = br.s1 - br.s0; if (span < 0) span += D.L; s = br.s0 + span * q.bfrac; }
  let ds = s - k.lastS; if (ds > D.L / 2) ds -= D.L; if (ds < -D.L / 2) ds += D.L;
  if (Math.abs(ds) < 40) k.prog += ds;
  k.lastS = s;
  const lap = Math.max(1, Math.floor(k.prog / D.L) + 1);
  if (lap > k.lap) { k.lap = lap; k.events.push('lap'); }
  // wrong way
  const dot = Math.sin(k.yaw) * q.tx + Math.cos(k.yaw) * q.tz;
  if (dot < -0.3 && k.speed > 4) k.wrong += 1 / 60; else k.wrong = Math.max(0, k.wrong - 2 / 60);
}
export function startRespawn(k, world, q) {
  k.respawn = 1.5; k.speed = 0; k.vy = 0; k.vside = 0; k.driftDir = 0; k.glide = false; k.trick = false; k.boost = 0; k.events.push('fall');
  if (world.arena) { const p = world.arena.spawnNear(k.x, k.z); k.rx = p.x; k.rz = p.z; k.ry = 0; k.ryaw = k.yaw; return; }
  const D = world.D; let s = ((k.lastS % D.L) + D.L) % D.L;
  // first solid sample at or after s (jump over chasms), then a little further
  let p = pointAt(D, s, 0); let i = p.i, guard = 0;
  while ((D.GAP[i] || D.GAP[(i + 3) % D.N]) && guard++ < D.N) i = (i + 1) % D.N;
  if (guard) i = (i + 4) % D.N;
  const sp = pointAt(D, D.S[i], 0);
  k.rx = sp.x; k.rz = sp.z; k.ry = sp.y; k.ryaw = sp.yaw; k.rs = D.S[i];
}
function stepRespawn(k, world, dt) {
  k.respawn -= dt;
  const t = 1 - k.respawn / 1.5;
  if (t > 0.35) { k.hidden = false; k.x = k.rx; k.z = k.rz; k.yaw = k.ryaw; k.y = (k.ry || 0) + Math.max(0, (1 - t)) * 6; }
  else k.hidden = true;
  if (k.respawn <= 0) {
    k.respawn = 0; k.hidden = false; k.grounded = true; k.y = k.ry || 0; k.invuln = 1.5; k.hint = -1;
    if (!world.arena && k.rs != null) { let ds = k.rs - k.lastS; if (ds > world.D.L / 2) ds -= world.D.L; if (ds < -world.D.L / 2) ds += world.D.L; if (ds > -40 && ds < 120) k.prog += ds; k.lastS = k.rs; }
  }
}
export function hitKart(k, kind, by) {
  if (k.nova > 0 || k.invuln > 0 || k.respawn > 0 || k.out) return false;
  if (k.shield > 0) { k.shield = 0; k.events.push('shieldpop'); return false; }
  if (kind === 'tumble') { k.tumble = 1.25; k.speed *= 0.25; k.vy = Math.max(k.vy, 0); }
  else if (kind === 'squash') { k.spin = 0.9; k.speed *= 0.35; k.shrink = Math.max(k.shrink, 2.5); }
  else { k.spin = 1.0; k.speed *= 0.35; }
  k.driftDir = 0; k.driftLvl = 0; k.boost = 0; k.trick = false; k.invuln = 1.6 + (kind === 'tumble' ? 0.4 : 0);
  const lose = Math.min(k.coins, kind === 'tumble' ? 3 : 2); k.coins -= lose; k.hits++; k.lastHitBy = by != null ? by : -1;
  k.events.push(kind === 'tumble' ? 'tumble' : 'spin');
  return true;
}
