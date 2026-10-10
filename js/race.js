// Race / battle session: grid, countdown + rocket start, laps, ranking, rubber-banding, finish, battle rules.
import { buildTrackData, pointAt } from './track.js';
import { makeKartState, stepKart, hitKart, startRespawn } from './kart.js';
import { setupEntities, stepItems } from './items.js';
import { initAI, driveAI } from './ai.js';
import { makeArena } from './arena.js';
import { CHARS, BODIES, WHEELS, DIFF, trackById, charById, ARENAS } from './data.js';
import { rng, clamp } from './util.js';

export function statsFor(look) {
  const c = charById(look.char), b = BODIES.find((x) => x.id === look.body) || BODIES[0], w = WHEELS.find((x) => x.id === look.wheels) || WHEELS[0];
  const o = {}; for (const k of ['spd', 'acc', 'han', 'wt']) o[k] = clamp(c.stat[k] + b.stat[k] + w.stat[k], 0, 6);
  return o;
}
export class Race {
  constructor(cfg) {
    this.cfg = cfg; this.mode = cfg.mode; this.diff = DIFF[cfg.diff] || DIFF.normal; this.rand = rng(cfg.seed || 1234);
    this.time = 0; this.count = cfg.skipCount ? 0 : 3.6; this.state = this.count > 0 ? 'count' : 'run'; this.frozen = this.state === 'count';
    this.cbs = { event() {}, fx() {}, flash() {} }; this.fxQueue = []; this.evQueue = [];
    this.battle = this.mode === 'battle' || this.mode === 'coins';
    if (this.battle) { const A = ARENAS.find((a) => a.id === cfg.track) || ARENAS[0]; this.arenaDef = A; this.world = { arena: makeArena(A) }; this.timeLimit = this.mode === 'coins' ? 120 : 150; }
    else { this.T = trackById(cfg.track); this.D = buildTrackData(this.T); this.world = { D: this.D }; this.laps = cfg.laps || this.T.laps; }
    this.karts = cfg.racers.map((r, i) => { const k = makeKartState({ slot: i, name: r.name, look: r.look, ctrl: r.ctrl, pid: r.pid || null, stats: statsFor(r.look) }); if (r.ctrl === 'cpu') initAI(k, this.diff.skill * (0.9 + this.rand() * 0.15), rng((cfg.seed || 1) * 31 + i * 7)); k.var = 0.985 + this.rand() * 0.03; return k; });
    this.finishOrder = []; this.done = false; this.endTimer = -1; this.ghostRec = [];
  }
  attachWorld(W) { this.world.W = W; if (W && W.minY != null) this.world.minY = W.minY; if (W && W.lavaY != null) this.world.lavaY = W.lavaY; setupEntities(this); this.placeGrid(); }
  placeGrid() {
    const ks = this.karts;
    if (this.battle) { const sp = this.world.arena.spawns; ks.forEach((k, i) => { const s = sp[i % sp.length]; k.x = s.x; k.z = s.z; k.y = 0; k.yaw = s.yaw; k.hint = 0; k.balloons = 3; k.coins = this.mode === 'coins' ? 0 : 0; });
      if (this.mode === 'coins') { const A = this.world.arena; for (let i = 0; i < 46; i++) { const a = this.rand() * Math.PI * 2, r = 6 + this.rand() * (A.lim - 10); const x = Math.cos(a) * r, z = Math.sin(a) * r; if (A.obstacles.some((o) => (x - o[0]) ** 2 + (z - o[1]) ** 2 < (o[2] + 2) ** 2)) continue; this.coinsW.push({ x, y: 0.9, z, t: 0, respawn: true }); } }
      return; }
    // humans start at the back of the grid (like a real GP), CPUs in front
    const order = ks.map((k, i) => i).sort((a, b) => (ks[a].ctrl === 'cpu' ? 0 : 1) - (ks[b].ctrl === 'cpu' ? 0 : 1) || a - b);
    if (this.cfg.gridOrder) order.splice(0, order.length, ...this.cfg.gridOrder.filter((i) => i < ks.length));
    order.forEach((ki, pos) => { const k = ks[ki]; const row = pos >> 1, side = pos % 2 ? 1 : -1; const s = -7 - row * 6 - (pos % 2) * 2.5; const p = pointAt(this.D, s, side * this.D.hw * 0.45);
      k.x = p.x; k.y = p.y; k.z = p.z; k.yaw = p.yaw; k.prog = s; k.lastS = ((s % this.D.L) + this.D.L) % this.D.L; k.hint = -1; k.lap = 1; });
  }
  ranking() {
    const ks = this.karts;
    if (this.battle) { const key = (k) => this.mode === 'coins' ? k.coins * 1000 + (k.hitsDealt || 0) : (k.out ? -1000 + (k.outAt || 0) : k.balloons * 1000 + (k.score || 0)); return ks.map((k, i) => i).sort((a, b) => key(ks[b]) - key(ks[a])); }
    return ks.map((k, i) => i).sort((a, b) => { const A = ks[a], B = ks[b]; if (A.finished && B.finished) return A.finishTime - B.finishTime; if (A.finished) return -1; if (B.finished) return 1; return B.prog - A.prog; });
  }
  step(dt, inputs) {
    const ks = this.karts;
    if (this.done) return;
    if (this.state === 'count') {
      const before = this.count; this.count -= dt;
      ks.forEach((k, i) => { const inp = inputs && inputs[i]; const gas = inp ? (inp.gas || inp.drift) : false; if (k.ctrl === 'cpu') { // CPUs nail a rocket start sometimes
          if (this.count < 0.9 && this.count > 0.4 && !k.gasAt && this.rand() < 0.04 * k.ai.skill) k.gasAt = this.count; }
        else { if (gas && !k.gasAt) k.gasAt = this.count; if (!gas) k.gasAt = 0; } });
      if (Math.ceil(before) !== Math.ceil(this.count) && this.count > 0) this.emit(null, 'count' + Math.ceil(this.count));
      if (this.count <= 0) { this.state = 'run'; this.frozen = false; this.emit(null, 'go');
        ks.forEach((k) => { if (k.gasAt && k.gasAt < 1.05 && k.gasAt > 0.3) { k.boost = 1.1; k.boostLvl = 3; k.events.push('rocketstart'); } else if (k.gasAt && k.gasAt > 1.7) { k.spin = 0.7; k.events.push('burnout'); } }); }
      ks.forEach((k) => this.flushEvents(k));
      return;
    }
    this.time += dt;
    // inputs
    ks.forEach((k, i) => {
      if (k.ctrl === 'cpu' || k.autopilot) { if (!k.ai) initAI(k, 0.95, rng(i + 77)); driveAI(this, k, dt); }
      else if (inputs && inputs[i]) { const s = inputs[i]; k.in.steer = s.steer; k.in.gas = s.gas; k.in.brake = s.brake; k.in.drift = s.drift; if (s.item && !k.in.item) k.pressItem = true; k.in.item = s.item; }
      // rubber band (CPUs only, gentle)
      if (k.ctrl === 'cpu' && !this.battle) { const ref = this.refProg(); const d = ref - k.prog; k.cpuMul = this.diff.spd * k.var * (1 + clamp(d / 260, -0.7, 1) * this.diff.rubber); }
      else if (k.ctrl === 'cpu') k.cpuMul = this.diff.spd;
      if (k.out) { k.speed *= 0.95; return; }
      stepKart(k, this.world, dt, this);
      if (k.stuck > 4 && !this.battle) { k.stuck = 0; startRespawn(k, this.world, {}); }
    });
    this.collide();
    stepItems(this, dt);
    // ranking + finish
    const rk = this.ranking(); rk.forEach((ki, p) => { ks[ki].place = p + 1; });
    if (!this.battle) ks.forEach((k) => { if (!k.finished && k.prog >= this.laps * this.D.L) { k.finished = true; k.finishTime = this.time; k.lap = this.laps; this.finishOrder.push(k.slot); k.events.push('finish'); if (k.ctrl !== 'cpu') k.autopilot = true; } });
    if (this.cfg.ghostRecord && ks[this.cfg.me] && !ks[this.cfg.me].finished) { this.gAcc = (this.gAcc || 0) + dt; if (this.gAcc >= 1 / 15) { this.gAcc -= 1 / 15; const k = ks[this.cfg.me]; this.ghostRec.push([+k.x.toFixed(2), +k.y.toFixed(2), +k.z.toFixed(2), +k.yaw.toFixed(3), +k.steer.toFixed(2)]); } }
    ks.forEach((k) => this.flushEvents(k));
    this.checkEnd(dt);
  }
  refProg() { let best = -1e9, any = false; for (const k of this.karts) if (k.ctrl !== 'cpu') { any = true; best = Math.max(best, k.prog); } if (!any) for (const k of this.karts) best = Math.max(best, k.prog); return best; }
  collide() {
    const ks = this.karts;
    for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) { const A = ks[a], B = ks[b]; if (A.respawn > 0 || B.respawn > 0 || A.out || B.out) continue;
      const dx = B.x - A.x, dz = B.z - A.z, d2 = dx * dx + dz * dz, rr = (A.shrink > 0 ? 0.8 : 1.35) + (B.shrink > 0 ? 0.8 : 1.35);
      if (d2 < rr * rr && Math.abs(A.y - B.y) < 1.6) { const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, pen = rr - d;
        const wa = 1 + A.wt * 0.25 + (A.nova > 0 ? 5 : 0), wb = 1 + B.wt * 0.25 + (B.nova > 0 ? 5 : 0), ta = wb / (wa + wb), tb = wa / (wa + wb);
        A.x -= nx * pen * ta; A.z -= nz * pen * ta; B.x += nx * pen * tb; B.z += nz * pen * tb;
        // sideways shove in kart-local frame
        const ra = -Math.cos(A.yaw), rza = Math.sin(A.yaw), rb = -Math.cos(B.yaw), rzb = Math.sin(B.yaw);
        A.vside -= (nx * ra + nz * rza) * 5 * ta; B.vside += (nx * rb + nz * rzb) * 5 * tb;
        if (pen > 0.3) { A.events.push('bonk'); } } }
  }
  onHit(victim, attacker) {
    if (this.battle && this.mode === 'battle') { victim.balloons = Math.max(0, victim.balloons - 1); if (attacker && attacker !== victim) attacker.score = (attacker.score || 0) + 1; victim.events.push('balloon');
      if (victim.balloons <= 0) { victim.out = true; victim.outAt = this.time; victim.events.push('out'); } }
    if (this.mode === 'coins') { const drop = Math.min(victim.coins, Math.max(1, Math.floor(victim.coins / 2))); victim.coins -= drop; for (let i = 0; i < drop; i++) { const a = this.rand() * 6.28, r = 3 + this.rand() * 5; this.coinsW.push({ x: victim.x + Math.cos(a) * r, y: 0.9, z: victim.z + Math.sin(a) * r, t: 0.8, respawn: false }); } if (attacker) attacker.hitsDealt = (attacker.hitsDealt || 0) + 1; }
  }
  fx(type, x, y, z) { this.cbs.fx(type, x, y, z); this.fxQueue.push([type, +x.toFixed(1), +y.toFixed(1), +z.toFixed(1)]); }
  flash(type, e) { this.cbs.flash(type, e); this.fxQueue.push(['flash_' + type, 0, 0, 0]); }
  emit(k, ev) { this.cbs.event(k, ev); this.evQueue.push([k ? k.slot : -1, ev]); }
  flushEvents(k) { if (k.events.length) { for (const ev of k.events) this.emit(k, ev); k.events.length = 0; } }
  checkEnd(dt) {
    const ks = this.karts, humans = ks.filter((k) => k.ctrl !== 'cpu');
    if (this.battle) {
      if (this.mode === 'coins') this.coinsW = this.coinsW.filter((c) => c.respawn !== false || c.t < 1e8);
      const alive = ks.filter((k) => !k.out); const humansAlive = humans.filter((k) => !k.out);
      if (this.endTimer < 0 && (this.time >= this.timeLimit || (this.mode === 'battle' && (alive.length <= 1 || humansAlive.length === 0)))) this.endTimer = 2.5;
    } else if (this.endTimer < 0 && humans.length && humans.every((k) => k.finished)) this.endTimer = 3.5;
    else if (this.endTimer < 0 && !humans.length && ks.every((k) => k.finished)) this.endTimer = 0.5;
    if (this.endTimer >= 0) { this.endTimer -= dt; if (this.endTimer < 0) this.finish(); }
  }
  finish() {
    if (this.done) return; this.done = true;
    const ks = this.karts;
    if (!this.battle) { // estimate times for unfinished racers from their pace
      ks.forEach((k) => { if (!k.finished) { const left = this.laps * this.D.L - k.prog; const pace = Math.max(18, k.prog / Math.max(1, this.time)); k.finishTime = this.time + left / pace; k.estimated = true; } });
    }
    this.results = this.ranking().map((ki, p) => { const k = ks[ki]; k.place = p + 1; return { slot: ki, name: k.name, look: k.look, ctrl: k.ctrl, pid: k.pid, place: p + 1, time: k.finishTime, est: !!k.estimated, coins: k.coinsTotal, balloons: k.balloons, score: k.score || 0, bcoins: k.coins }; });
    this.emit(null, 'raceover');
  }
}
