// CPU drivers: racing line with corner cutting, drift mini-turbos, item tactics, hazard avoidance, battle hunting.
import { pointAt, query } from './track.js';
import { clamp, wrapAng } from './util.js';

const Q = {};
function curvAhead(D, s, dist) { // signed heading change over the next `dist` metres
  const a = pointAt(D, s, 0), b = pointAt(D, s + dist, 0); return wrapAng(Math.atan2(b.tx, b.tz) - Math.atan2(a.tx, a.tz));
}
export function initAI(k, skill, rand) {
  k.ai = { lane: (rand() - 0.5) * 0.7, skill, rand, itemDelay: 0.6 + rand() * 2, laneT: 0, shortcut: -1, wobble: 0, decide: 0 };
}
export function driveAI(race, k, dt) {
  const A = k.ai, inp = k.in, w = race.world;
  if (w.arena) return battleAI(race, k, dt);
  const D = w.D, hw = D.hw;
  inp.gas = true; inp.brake = false;
  const sp = Math.max(8, Math.abs(k.speed));
  const s = k.lastS;
  // lane drift over time keeps the pack spread out
  A.laneT -= dt; if (A.laneT <= 0) { A.laneT = 3 + A.rand() * 4; A.lane = clamp(A.lane + (A.rand() - 0.5) * 0.5, -0.55, 0.55); }
  const look = 9 + sp * 0.42;
  const turn = curvAhead(D, s + look * 0.5, 30);
  let lat = A.lane * hw - Math.sign(turn) * Math.min(1, Math.abs(turn) / 0.9) * hw * 0.42 * A.skill;
  // dodge hazards / slime / karts right ahead
  const avoid = (x, z, r) => { const q = query(D, x, z, k.hint, Q); let ds = q.s - s; if (ds < -D.L / 2) ds += D.L; if (ds > 2 && ds < 22 && Math.abs(q.lat - lat) < r + 2.2) lat = q.lat + (q.lat > lat ? -1 : 1) * (r + 2.6); };
  if (A.skill > 0.5) { for (const e of race.ents) if (e.type === 'slime' || e.type === 'boom') avoid(e.x, e.z, e.r); for (const h of race.hazards) if (h.on && h.type !== 'sweeper' && h.type !== 'car' && h.type !== 'boulder' && h.type !== 'snowball') avoid(h.x, h.z, h.r); }
  // glide ramps & chasms: stay centred
  let nearGap = false; for (let d = 0; d < 60; d += 6) { const p = pointAt(D, s + d, 0); if (D.GAP[p.i]) { nearGap = true; break; } }
  if (nearGap) lat = 0;
  // void edges (space/lava): tighter
  const pv = pointAt(D, s + look, 0); if (D.VOID[pv.i]) lat *= 0.55;
  lat = clamp(lat, -hw + 1.6, hw - 1.6);
  let tgt = pointAt(D, s + look, lat);
  // optional shortcut for skilled CPUs
  if (A.shortcut < 0 && A.skill >= 0.8) D.branches.forEach((br, bi) => { let ds = br.s0 - s; if (ds < 0) ds += D.L; if (ds > 18 && ds < 30 && A.decide !== br.s0) { A.decide = br.s0; if (A.rand() < 0.45) A.shortcut = bi; } });
  if (A.shortcut >= 0) { const br = D.branches[A.shortcut]; let bi = 0, bd = 1e18; for (let i = 0; i < br.n; i++) { const d = (br.X[i] - k.x) ** 2 + (br.Z[i] - k.z) ** 2; if (d < bd) { bd = d; bi = i; } }
    let ds = br.s0 - s; if (ds < -D.L / 2) ds += D.L; if (ds > D.L / 2) ds -= D.L;
    if (ds > 1) { tgt = { x: br.X[0], z: br.Z[0] }; if (ds > 35) A.shortcut = -1; }
    else { const j = Math.min(br.n - 1, bi + 5); tgt = { x: br.X[j], z: br.Z[j] }; if (bi >= br.n - 3) A.shortcut = -1; } }
  const want = Math.atan2(tgt.x - k.x, tgt.z - k.z);
  let diff = wrapAng(k.yaw - want); // + = need to turn right
  if (k.splat > 0) diff += Math.sin(race.time * 3 + k.slot) * 0.25;
  A.wobble = (A.wobble + (A.rand() - 0.5) * dt * 2 * (1 - A.skill)) * 0.98;
  let steer = clamp(diff * 2.4 + A.wobble, -1, 1);
  // drifting: hold through sustained corners
  const corner = curvAhead(D, s, 34);
  if (k.driftDir === 0) { if (Math.abs(corner) > 0.65 && sp > 16 && A.rand() < A.skill * 0.15 && k.grounded && !nearGap) { inp.drift = true; A.driftWant = Math.sign(-corner) || 1; } else inp.drift = false; }
  else { const rem = curvAhead(D, s, 18); if (Math.abs(rem) < 0.18 || (A.skill > 0.85 && k.driftLvl >= 2 && Math.abs(rem) < 0.35) || Math.sign(-rem) !== k.driftDir) inp.drift = false; else inp.drift = true; }
  if (inp.drift && k.driftDir === 0 && A.driftWant) steer = A.driftWant * Math.max(0.5, Math.abs(steer));
  if (k.driftDir !== 0) steer = clamp((diff * 2.4) * 1.0, -1, 1); // drift turn-rate is modulated by steer
  inp.steer = steer;
  // tricks off ramps
  inp.trickReq = false;
  if (k.launched && !k.grounded && !k.trick && k.air > 0.12 && A.rand() < A.skill * 0.2) { inp.drift = !k.prev.drift; }
  // stuck: reverse out
  if (k.stuck > 1.2) { inp.gas = false; inp.brake = true; inp.steer = -Math.sign(diff || 1); }
  // items
  useItems(race, k, dt, s);
}
function useItems(race, k, dt, s) {
  const A = k.ai; k.in.item = false; if (!k.item || k.roulette > 0) return;
  A.itemDelay -= dt; if (A.itemDelay > 0) return;
  const it = k.item; let go = false;
  const ahead = race.karts.filter((o) => o !== k && !o.out).map((o) => { const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); const fa = wrapAng(Math.atan2(dx, dz) - k.yaw); return { o, d, fa }; });
  const target = ahead.find((a) => a.d < 40 && Math.abs(a.fa) < 0.22);
  const behind = ahead.find((a) => a.d < 14 && Math.abs(a.fa) > 2.6);
  switch (it) {
    case 'turbo': case 'turbo3': case 'nova': case 'magnet': case 'shield': go = true; break;
    case 'puck': case 'boom': go = !!target || A.rand() < 0.01; break;
    case 'seeker': case 'zap': case 'splat': go = k.place > 1 || race.mode === 'battle'; break;
    case 'slime': go = !!behind || A.rand() < 0.006; break;
    default: go = true;
  }
  if (go && A.rand() < race.diff.items + 0.15) { k.in.item = true; A.itemDelay = 0.5 + A.rand() * 1.5; k.pressItem = true; }
}
function battleAI(race, k, dt) {
  const A = k.ai, inp = k.in, ar = race.world.arena; inp.gas = true; inp.brake = false; inp.drift = false;
  A.retarget = (A.retarget || 0) - dt;
  if (A.retarget <= 0 || !A.goal) {
    A.retarget = 1.5 + A.rand() * 2;
    let goal = null;
    if (race.mode === 'coins') { let bd = 1e18; race.coinsW.forEach((c) => { if (c.t > 0) return; const d = (c.x - k.x) ** 2 + (c.z - k.z) ** 2; if (d < bd) { bd = d; goal = c; } }); }
    if (!k.item && !goal) { let bd = 1e18; race.boxes.forEach((b) => { if (b.t > 0) return; const d = (b.x - k.x) ** 2 + (b.z - k.z) ** 2; if (d < bd) { bd = d; goal = b; } }); }
    if (k.item || !goal || A.rand() < 0.35) { let bd = 1e18; race.karts.forEach((o) => { if (o === k || o.out) return; const d = (o.x - k.x) ** 2 + (o.z - k.z) ** 2 * (0.7 + A.rand() * 0.6); if (d < bd) { bd = d; goal = o; } }); }
    A.goal = goal;
  }
  const g = A.goal || { x: 0, z: 0 };
  let want = Math.atan2(g.x - k.x, g.z - k.z);
  // steer around obstacles + walls
  const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
  for (const o of ar.obstacles) { const dx = o[0] - (k.x + fx * 6), dz = o[1] - (k.z + fz * 6); if (dx * dx + dz * dz < (o[2] + 3) ** 2) want += wrapAng(Math.atan2(dx, dz) - k.yaw) > 0 ? -0.9 : 0.9; }
  if (ar.edgeDist(k.x + fx * 8, k.z + fz * 8) < 2) want = Math.atan2(-k.x, -k.z);
  const diff = wrapAng(k.yaw - want);
  inp.steer = clamp(diff * 2.2, -1, 1);
  if (k.stuck > 1) { inp.gas = false; inp.brake = true; inp.steer = -Math.sign(diff || 1); }
  useItems(race, k, dt, 0);
}
