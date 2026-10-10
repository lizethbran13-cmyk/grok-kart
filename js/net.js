// Online play via GrokNet (PeerJS): host-authoritative, 5-letter codes, up to 3 players, CPUs fill the grid.
import { S, persist } from './save.js';
import { TRACKS, ARENAS, CHARS, BODIES, WHEELS, GLIDERS, PAINTS, DIFF, RACERS, charById } from './data.js';
import { esc, toast, $ } from './util.js';
import { readInput } from './input.js';
import { sfx } from './audio.js';
import { initAI } from './ai.js';
import { rng, damp, wrapAng } from './util.js';

const GN = window.GrokNet;
export const Net = { room: null, looks: {}, inputs: {}, cfg: { mode: 'vs', track: 'city', arena: 'plaza', diff: 'normal', cpus: true }, lastCfg: null };
let G = null, H = null;
Net.init = (g, hooks) => { G = g; H = hooks; };
function status(t, ok) { const m = $('onlineMsg'); if (m) { m.textContent = t; m.style.color = ok ? '#15803d' : '#be123c'; } Net.lastStatus = t; }
function cleanLook(l) { l = l && typeof l === 'object' ? l : {}; return { char: CHARS.some((c) => c.id === l.char) ? l.char : 'grok', body: BODIES.some((c) => c.id === l.body) ? l.body : 'classic', wheels: WHEELS.some((c) => c.id === l.wheels) ? l.wheels : 'std', glider: GLIDERS.some((c) => c.id === l.glider) ? l.glider : 'chute', paint: /^#[0-9a-fA-F]{6}$/.test(l.paint || '') ? l.paint : PAINTS[0] }; }
function myName() { return GN.cleanName(S.name || charById(S.look.char).n); }
function panel(html, mount) { const ui = $('ui'); ui.innerHTML = `<div class="screen online">${html}</div>`; ui.classList.add('open'); if (mount) mount(ui.firstChild); }

Net.lobby = function () {
  if (!GN) return toast('Online play unavailable', true);
  if (Net.room && Net.room.opened) return Net.roomPanel();
  G.menuScene(); G.state = 'menu';
  panel(`<div class="topBar"><button class="back" id="nBack">◀</button><h2>🌐 ONLINE</h2></div>
    <p class="sub">Race or battle with up to 3 friends. One player hosts and shares the 5-letter code. CPUs fill the empty spots.</p>
    <h3>YOUR NAME</h3><input id="nName" maxlength="12" value="${esc(myName())}">
    <button class="go" id="bHost">🏠 HOST A GAME</button><h3>OR JOIN WITH A CODE</h3>
    <div class="joinRow"><input id="codeIn" maxlength="5" placeholder="ABCDE" autocomplete="off" autocapitalize="characters"><button class="mbtn2" id="bJoin">JOIN</button></div>
    <p class="sub" id="onlineMsg"></p>`, (c) => {
    const nm = () => { S.name = GN.cleanName(c.querySelector('#nName').value); persist(); };
    c.querySelector('#nBack').addEventListener('click', () => { if (Net.room && !Net.room.opened) Net.leave(); G.toTitle(); });
    c.querySelector('#bHost').addEventListener('click', () => { nm(); sfx('click'); Net.host(); });
    c.querySelector('#bJoin').addEventListener('click', () => { nm(); sfx('click'); const code = GN.normalizeCode(c.querySelector('#codeIn').value); if (!GN.validCode(code)) return status('Codes are 5 letters, like KDXPQ'); Net.join(code); });
  });
};
Net.roomPanel = function () {
  const room = Net.room; if (!room) return; if (G.state !== 'menu' || G.race) G.menuScene(); G.state = 'menu'; const ps = room.players(), host = room.isHost, c = Net.cfg;
  const list = ps.map((p) => `<div class="pRow"><span class="sw" style="background:${GN.cleanColor(p.color)}"></span><b>${esc((Net.looks[p.pid] && Net.looks[p.pid].name) || p.name)}</b><small>${p.slot === 0 ? 'Host' : 'Player ' + (p.slot + 1)}${p.pid === room.pid ? ' (you)' : ''}</small></div>`).join('');
  const segs = (id, opts, val) => `<div class="seg wrap" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" class="${v === val ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  panel(`<div class="topBar"><h2>ROOM <span class="code">${room.code}</span></h2></div><p class="sub">Friends join with code <b>${room.code}</b> (${ps.length}/3)</p><div class="pList">${list}</div>` +
    (host ? `<h3>MODE</h3>${segs('nMode', [['vs', '🏁 Race'], ['battle', '🎈 Balloons'], ['coins', '🪙 Coins']], c.mode)}
      <h3>${c.mode === 'vs' ? 'TRACK' : 'ARENA'}</h3>${c.mode === 'vs' ? segs('nTrack', TRACKS.map((t) => [t.id, t.n]), c.track) : segs('nArena', ARENAS.map((a) => [a.id, a.n]), c.arena)}
      <h3>CPU RACERS</h3>${segs('nCpu', [['1', 'Fill with CPUs'], ['0', 'Friends only']], c.cpus ? '1' : '0')}<h3>CPU LEVEL</h3>${segs('nDiff', Object.keys(DIFF).map((k) => [k, DIFF[k].n]), c.diff)}
      <div class="btnRow"><button class="mbtn2" id="bLeave">LEAVE</button><button class="go" id="bStart" ${ps.length < 2 ? 'disabled' : ''}>START! ▶</button></div>${ps.length < 2 ? '<p class="sub">Waiting for a friend to join…</p>' : ''}`
      : `<p class="sub">Waiting for the host to pick a track and start… 🏎️</p><div class="btnRow"><button class="mbtn2" id="bLeave">LEAVE</button></div>`), (cc) => {
    cc.querySelector('#bLeave').addEventListener('click', () => { Net.leave(); G.toTitle(); });
    if (!host) return;
    const bs = (id, f) => { const el = cc.querySelector('#' + id); if (el) el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { sfx('click'); f(b.dataset.v); Net.roomPanel(); })); };
    bs('nMode', (v) => { c.mode = v; }); bs('nTrack', (v) => { c.track = v; }); bs('nArena', (v) => { c.arena = v; }); bs('nCpu', (v) => { c.cpus = v === '1'; }); bs('nDiff', (v) => { c.diff = v; });
    cc.querySelector('#bStart').addEventListener('click', () => Net.start());
  });
};
function bind(room) {
  Net.room = room;
  room.on('status', (t) => status(t, true));
  room.on('open', () => { status('Connected!', true); sfx('coin'); room.send({ t: 'look', name: myName(), look: S.look }); if (room.isHost) Net.looks[room.pid] = { name: myName(), look: cleanLook(S.look) }; Net.roomPanel(); toast(room.isHost ? 'Room ' + room.code + ' is open!' : 'Joined room ' + room.code + '!'); });
  room.on('join', (p) => { if (p.pid !== room.pid) { toast('👋 ' + p.name + ' joined!'); sfx('coin'); } if (G.state === 'menu' && Net.room) Net.roomPanel(); });
  room.on('leave', (p) => { toast(p.name + ' left', true); if (G.state === 'menu' && Net.room) Net.roomPanel();
    if (room.isHost && G.race && G.race.cfg.online) G.race.karts.forEach((k, i) => { if (k.pid === p.pid && k.ctrl === 'remote') { k.ctrl = 'cpu'; initAI(k, G.race.diff.skill, rng(i + 5)); toast('A CPU takes over for ' + p.name); } }); });
  room.on('message', (d, from) => onMsg(d, from));
  room.on('reconnecting', () => toast('Lost the host - reconnecting…', true));
  room.on('error', (e) => { status(e.title + ': ' + e.message); const inGame = G.race && G.race.cfg.online; Net.room = null; if (inGame || G.state === 'menu') { toast(e.title + ' - back to the menu', true); G.session = null; G.toTitle(); } });
  room.start();
}
Net.host = (code) => { status('Opening a room…', true); Net.looks = {}; bind(GN.createRoom({ role: 'host', code: code || undefined, name: myName(), color: GN.COLORS[0], max: 3, rejoin: !!code })); };
Net.join = (code) => { status('Joining ' + code + '…', true); bind(GN.createRoom({ role: 'join', code, name: myName(), color: GN.COLORS[1], rejoin: !!Net.fromHub })); };
Net.fromParams = (prm) => { Net.fromHub = true; S.name = prm.name; persist(); Net.lobby(); if (prm.mode === 'host') Net.host(prm.code); else Net.join(prm.code); };
Net.leave = () => { if (!Net.room) return; try { Net.room.leave(); } catch (e) {} Net.room = null; };

Net.start = function () {
  const room = Net.room; if (!room || !room.isHost) return; const ps = room.players(); if (ps.length < 2) return; const c = Net.cfg;
  const seed = (Math.random() * 1e9) | 0, R = rng(seed);
  const racers = ps.map((p) => { const L = Net.looks[p.pid] || { name: p.name, look: cleanLook({}) }; return { name: GN.cleanName(L.name), ctrl: p.pid === room.pid ? 'human' : 'remote', pid: p.pid, look: cleanLook(L.look) }; });
  const total = c.mode === 'vs' ? RACERS : 6; const used = racers.map((r) => r.look.char);
  if (c.cpus) { const pool = CHARS.filter((ch) => !used.includes(ch.id)); while (racers.length < total) { const ch = pool.length ? pool.splice((R() * pool.length) | 0, 1)[0] : CHARS[(R() * CHARS.length) | 0]; racers.push({ name: ch.n, ctrl: 'cpu', look: { char: ch.id, body: BODIES[(R() * BODIES.length) | 0].id, wheels: WHEELS[(R() * WHEELS.length) | 0].id, glider: 'chute', paint: PAINTS[(R() * PAINTS.length) | 0] } }); } }
  const cfg = { mode: c.mode, track: c.mode === 'vs' ? c.track : c.arena, diff: c.diff, seed, racers, online: true };
  Net.lastCfg = cfg; room.broadcast({ t: 'start', cfg }); Net.begin(cfg, true);
};
Net.begin = function (cfg, host) {
  const me = cfg.racers.findIndex((r) => r.pid === Net.room.pid);
  // on guests every non-local kart is driven by snapshots
  const c = Object.assign({}, cfg, { me, guest: !host, racers: cfg.racers.map((r, i) => Object.assign({}, r, { ctrl: host ? r.ctrl : (i === me ? 'human' : 'remote') })) });
  Net.inputs = {}; Net.sAcc = 0; Net.iAcc = 0; Net.snap = null; H.startRace(c);
};
Net.remoteInput = (slot) => Net.inputs[slot] || null;
Net.backToLobby = () => { if (Net.room && Net.room.isHost) Net.room.broadcast({ t: 'lobby' }); Net.roomPanel(); };

// ---- host: snapshots @ 20 Hz ----
const r2 = (v) => Math.round(v * 100) / 100;
Net.hostTick = function (dt) {
  const r = G.race; if (!r || !Net.room) return; Net.sAcc += dt; if (Net.sAcc < 0.05) return; Net.sAcc = 0;
  const k = r.karts.map((k) => [r2(k.x), r2(k.y), r2(k.z), Math.round(k.yaw * 1000) / 1000, r2(k.speed), r2(k.steer), r2(k.driftVis), k.driftDir, k.driftLvl, (k.boost > 0 ? 1 : 0) | (k.glide ? 2 : 0) | (k.shield > 0 ? 4 : 0) | (k.nova > 0 ? 8 : 0) | (k.shrink > 0 ? 16 : 0) | (k.hidden ? 32 : 0) | (k.grounded ? 64 : 0) | (k.out ? 128 : 0) | (k.finished ? 256 : 0) | (k.trick ? 512 : 0) | (k.splat > 0 ? 1024 : 0) | (k.roulette > 0 ? 2048 : 0),
    k.boostLvl, r2(k.spin), r2(k.tumble), r2(k.trickVis), k.place, k.lap, k.item || '', k.itemQty, k.coins, k.balloons, r2(k.pitch), r2(k.roll), r2(k.groundY), r2(k.prog), k.finishTime ? r2(k.finishTime) : 0, k.trickAxis, k.surfLast === 'off' ? 1 : 0, r2(k.wrong)]);
  const e = r.ents.map((e) => [e.id, e.type, r2(e.x), r2(e.y), r2(e.z), e.landed ? 1 : 0, r2(e.fuse || 0)]);
  const b = r.boxes.map((b) => (b.t > 0 ? 1 : 0)).join('');
  const c = r.mode === 'coins' ? r.coinsW.map((c) => [r2(c.x), r2(c.z), c.t > 0 ? 1 : 0]) : r.coinsW.map((c) => (c.t > 0 ? 1 : 0)).join('');
  const msg = { t: 's', tm: r2(r.time), st: r.state, cn: r2(r.count), k, e, b, c, ev: r.evQueue.splice(0), fx: r.fxQueue.splice(0) };
  if (r.done && r.results) msg.res = r.results;
  Net.room.broadcast(msg);
};
// ---- guest: send input @ 30 Hz, smooth toward snapshots ----
Net.guestFrame = function (dt) {
  const r = G.race; if (!r || !Net.room) return;
  Net.iAcc += dt; if (Net.iAcc >= 1 / 30) { Net.iAcc = 0; const i = readInput(r.state === 'count'); Net.room.send({ t: 'in', s: [Math.round(i.steer * 100) / 100, i.gas ? 1 : 0, i.brake ? 1 : 0, i.drift ? 1 : 0, i.item ? 1 : 0] }); }
  const sn = Net.snap; if (!sn) return;
  r.time += dt; // advance between snapshots for hazards/ghost timing
  sn.k.forEach((a, i) => { const k = r.karts[i]; if (!k) return; const t = k._t || (k._t = {});
    const dx = a[0] - k.x, dz = a[2] - k.z; if (dx * dx + dz * dz > 64 || !k._init) { k.x = a[0]; k.y = a[1]; k.z = a[2]; k.yaw = a[3]; k._init = true; }
    else { const f = 1 - Math.exp(-14 * dt); k.x += (a[0] + Math.sin(a[3]) * a[4] * Net.snapAge - k.x) * f; k.z += (a[2] + Math.cos(a[3]) * a[4] * Net.snapAge - k.z) * f; k.y += (a[1] - k.y) * f; k.yaw += wrapAng(a[3] - k.yaw) * f; } });
  Net.snapAge = Math.min(0.12, (Net.snapAge || 0) + dt);
};
function applySnap(d) {
  const r = G.race; if (!r || !r.guest) return; Net.snap = d; Net.snapAge = 0;
  r.time = d.tm; r.state = d.st; r.count = d.cn; r.frozen = d.st === 'count';
  d.k.forEach((a, i) => { const k = r.karts[i]; if (!k) return; const f = a[9];
    Object.assign(k, { speed: a[4], steer: a[5], driftVis: a[6], driftDir: a[7], driftLvl: a[8], boost: f & 1 ? 1 : 0, glide: !!(f & 2), shield: f & 4 ? 1 : 0, nova: f & 8 ? 1 : 0, shrink: f & 16 ? 1 : 0, hidden: !!(f & 32), grounded: !!(f & 64), out: !!(f & 128), finished: !!(f & 256), trick: !!(f & 512), splat: f & 1024 ? 2 : 0, roulette: f & 2048 ? 1 : 0,
      boostLvl: a[10], spin: a[11], tumble: a[12], trickVis: a[13], place: a[14], lap: a[15], item: a[16] || null, itemQty: a[17], coins: a[18], balloons: a[19], pitch: a[20], roll: a[21], groundY: a[22], prog: a[23], finishTime: a[24], trickAxis: a[25], surfLast: a[26] ? 'off' : 'road', wrong: a[27] });
    k.spinVis = k.spin > 0 ? (k.spinVis || 0) + 0.7 : 0; });
  r.ents = d.e.map((e) => ({ id: e[0], type: e[1], x: e[2], y: e[3], z: e[4], landed: !!e[5], fuse: e[6] }));
  for (let i = 0; i < r.boxes.length; i++) r.boxes[i].t = d.b[i] === '1' ? 1 : 0;
  if (r.mode === 'coins') r.coinsW = d.c.map((c) => ({ x: c[0], y: 0.9, z: c[1], t: c[2] ? 1 : 0 }));
  else for (let i = 0; i < r.coinsW.length; i++) r.coinsW[i].t = d.c[i] === '1' ? 1 : 0;
  (d.fx || []).forEach(([t, x, y, z]) => { if (t.startsWith('flash_')) { if (r.cbs.flash) r.cbs.flash(t.slice(6)); } else if (r.cbs.fx) r.cbs.fx(t, x, y, z); });
  (d.ev || []).forEach(([slot, ev]) => H.onEvent(slot >= 0 ? r.karts[slot] : null, ev === 'raceover' ? 'raceover_net' : ev));
  if (d.res && !r.done) { r.done = true; r.results = d.res; setTimeout(() => H.showResults(r), 900); }
}
function onMsg(d, from) {
  const room = Net.room; if (!d || typeof d !== 'object' || !room) return;
  if (room.isHost) {
    if (d.t === 'look' && from) { Net.looks[from] = { name: GN.cleanName(d.name), look: cleanLook(d.look) }; if (G.state === 'menu') Net.roomPanel(); return; }
    if (d.t === 'in' && from && G.race && G.race.cfg.online) { const slot = G.race.karts.findIndex((k) => k.pid === from && k.ctrl === 'remote'); if (slot >= 0 && Array.isArray(d.s)) Net.inputs[slot] = { steer: Math.max(-1, Math.min(1, +d.s[0] || 0)), gas: !!d.s[1], brake: !!d.s[2], drift: !!d.s[3], item: !!d.s[4] }; }
    return;
  }
  if (d.t === 'start' && d.cfg && Array.isArray(d.cfg.racers)) { const cfg = d.cfg; cfg.racers = cfg.racers.slice(0, 8).map((r) => ({ name: GN.cleanName(r.name), ctrl: r.ctrl === 'cpu' ? 'cpu' : r.ctrl === 'human' || r.ctrl === 'remote' ? 'remote' : 'cpu', pid: r.pid ? String(r.pid).slice(0, 20) : null, look: cleanLook(r.look) })); if (!['vs', 'battle', 'coins'].includes(cfg.mode)) cfg.mode = 'vs'; if (!DIFF[cfg.diff]) cfg.diff = 'normal'; Net.begin(cfg, false); }
  else if (d.t === 's') applySnap(d);
  else if (d.t === 'lobby') { G.session = null; Net.roomPanel(); }
}
