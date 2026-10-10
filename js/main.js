// Grok Kart Party - game controller: menus, race flow, Grand Prix, time trial ghosts, battle, saves.
import * as THREE from 'three';
import { initEngine, setEnvironment, render, setQuality, trackFps, E } from './engine.js';
import { CHARS, BODIES, WHEELS, GLIDERS, PAINTS, ITEMS, TRACKS, CUPS, ARENAS, DIFF, GP_POINTS, RACERS, trackById, charById } from './data.js';
import { THEMES } from './themes.js';
import { buildWorld } from './world.js';
import { buildArenaWorld } from './arena.js';
import { Race, statsFor } from './race.js';
import { RaceView } from './view.js';
import { HUD, itemIcon } from './hud.js';
import { Showroom } from './showroom.js';
import { initInput, readInput, setControlMode, enableTilt, IN } from './input.js';
import { initAudio, sfx, engine, music, stopMusic, setSound, SND } from './audio.js';
import { S, persist, resetSave } from './save.js';
import { thumb } from './thumbs.js';
import { Net } from './net.js';
import { $, esc, fmtTime, ord, toast, rng, clamp } from './util.js';

const G = window.__gk = { ready: false, state: 'boot', race: null, view: null, hud: null, W: null, showroom: null, paused: false, session: null, autoDrive: false, S, simSpeed: 1 };
const UI = $('ui');

/* ---------------- boot ---------------- */
function boot() {
  $('loadBar').style.width = '30%';
  initEngine($('c'), S.opts.quality); E.autoQ = S.opts.autoQ !== false;
  E.onAutoLow = () => { S.opts.quality = 'low'; persist(); toast('Graphics set to LOW for smoother racing'); };
  initInput(S.opts); setControlMode(S.opts.steer, S.opts.auto); setSound(S.opts.sound, S.opts.music);
  IN.onKey = (code) => { if (code === 'Escape' || code === 'KeyP') { if (G.state === 'race') togglePause(); } if (code === 'KeyQ' && G.view) G.view.cam.back = !G.view.cam.back; };
  $('hPause').addEventListener('click', () => togglePause());
  document.addEventListener('pointerdown', () => initAudio(), { once: false, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'race' && !G.paused && !(G.race && G.race.cfg.online)) togglePause(); });
  $('loadBar').style.width = '70%';
  Net.init(G, { startRace, toLobbyUI: () => {}, onEvent, showResults });
  toTitle();
  $('loadBar').style.width = '100%';
  setTimeout(() => $('loading').classList.add('gone'), 250);
  last = performance.now(); requestAnimationFrame(frame);
  G.ready = true;
  const prm = window.GrokNet && GrokNet.params && GrokNet.params(); if (prm) Net.fromParams(prm);
}

/* ---------------- main loop ---------------- */
let last = 0, acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  trackFps(dt, now);
  if (G.state === 'race' && G.race) {
    if (!G.paused || (G.race.cfg.online)) { if (!G.race.guest) { acc += dt * G.simSpeed; let n = 0; while (acc >= 1 / 60 && n < 5) { simStep(1 / 60); acc -= 1 / 60; n++; } if (n >= 5) acc = 0; } else Net.guestFrame(dt); }
    G.view.update(dt); G.hud.update(dt);
    const me = G.race.karts[G.me]; if (me) engine(me.speed, me.boost > 0, !G.paused && !G.race.done);
  } else if (G.showroom) G.showroom.update(dt);
  render(dt);
}
function simStep(dt) {
  const r = G.race; const inputs = [];
  r.karts.forEach((k, i) => { if (i === G.me && k.ctrl === 'human') inputs[i] = G.autoDrive ? null : readInput(r.state === 'count'); else if (k.ctrl === 'remote') inputs[i] = Net.remoteInput(i); });
  if (G.autoDrive && r.karts[G.me] && !r.karts[G.me].autopilot) { r.karts[G.me].autopilot = true; }
  r.step(dt, inputs);
  if (r.cfg.online && !r.guest) Net.hostTick(dt);
}
G.sim = (sec, step = 1 / 60) => { const n = Math.round(sec / step); for (let i = 0; i < n; i++) { if (!G.race || G.race.done) break; simStep(step); } return G.race && G.race.time; };

/* ---------------- screens ---------------- */
function show(html, cls = 'screen', mount) { UI.innerHTML = `<div class="${cls}">${html}</div>`; UI.classList.add('open'); UI.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { sfx('click'); SCREENS[b.dataset.go](); })); if (mount) mount(UI.firstChild); return UI.firstChild; }
function closeUI() { UI.innerHTML = ''; UI.classList.remove('open'); }
G.closeUI = closeUI;
G.menuScene = () => { if (G.race || !G.showroom) { clearRaceScene(); hideRaceUI(); } ensureShowroom(); music('menu'); };
function coinsBadge() { return `<div class="coinsBadge">🪙 <b>${S.coins}</b></div>`; }
function ensureShowroom() { if (!G.showroom) { clearRaceScene(); G.showroom = new Showroom(); } G.showroom.setLook(S.look); }
const seg = (id, opts, val) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
function bindSeg(root, id, fn) { const el = root.querySelector('#' + id); if (!el) return; el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { sfx('click'); el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); fn(b.dataset.v); })); }
const tog = (id, on) => `<button class="tog ${on ? 'on' : ''}" id="${id}"><i></i></button>`;
function bindTog(root, id, fn) { const b = root.querySelector('#' + id); b.addEventListener('click', () => { b.classList.toggle('on'); sfx('click'); fn(b.classList.contains('on')); }); }

const SCREENS = {
  title: () => toTitle(),
  gp: () => modeFlow('gp'), tt: () => modeFlow('tt'), vs: () => modeFlow('vs'), battle: () => modeFlow('battle'),
  garage: () => garage(null), options: () => options(), howto: () => howto(), online: () => Net.lobby(),
};
G.SCREENS = SCREENS;
function toTitle() {
  G.state = 'menu'; G.paused = false; ensureShowroom(); hideRaceUI(); music('menu');
  show(`<div class="titleTop">${coinsBadge()}<button class="iconBtn" data-go="options">⚙️</button></div>
    <div class="logo"><span class="l1">GROK</span><span class="l2">KART PARTY</span></div>
    <div class="menuGrid">
      <button class="mbtn big gp" data-go="gp">🏆<b>GRAND PRIX</b><small>4 races · win the cup</small></button>
      <button class="mbtn vs" data-go="vs">🏁<b>VS RACE</b><small>any track</small></button>
      <button class="mbtn tt" data-go="tt">⏱️<b>TIME TRIAL</b><small>beat your ghost</small></button>
      <button class="mbtn battle" data-go="battle">🎈<b>BATTLE</b><small>balloons · coins</small></button>
      <button class="mbtn online" data-go="online">🌐<b>ONLINE</b><small>up to 3 friends</small></button>
      <button class="mbtn garage wide" data-go="garage">🛠️<b>GARAGE</b><small>racers · karts</small></button>
    </div>
    <button class="howBtn" data-go="howto">❓ HOW TO PLAY</button>`, 'screen title');
  if (!S.seenHow) { S.seenHow = true; persist(); setTimeout(() => { if (G.state === 'menu' && UI.querySelector('.title')) howto(true); }, 600); }
}
G.toTitle = toTitle;

/* ---------------- garage ---------------- */
const TABS = [['chars', 'Racer', CHARS], ['bodies', 'Kart', BODIES], ['wheels', 'Wheels', WHEELS], ['gliders', 'Glider', GLIDERS], ['paint', 'Paint', null]];
const lookKey = { chars: 'char', bodies: 'body', wheels: 'wheels', gliders: 'glider' };
let garageTab = 'chars';
function garage(next) {
  G.state = 'menu'; ensureShowroom();
  const tabDef = TABS.find((t) => t[0] === garageTab);
  const st = statsFor(S.look);
  const bar = (n, v) => `<div class="stat"><span>${n}</span><i><b style="width:${(v / 6) * 100}%"></b></i></div>`;
  let cards = '';
  if (garageTab === 'paint') cards = PAINTS.map((c) => `<button class="swatch ${S.look.paint === c ? 'on' : ''}" data-paint="${c}" style="background:${c}"></button>`).join('');
  else cards = tabDef[2].map((it) => { const owned = S.unl[garageTab].includes(it.id); const on = S.look[lookKey[garageTab]] === it.id;
    const look = Object.assign({}, S.look, { [lookKey[garageTab]]: it.id }); const view = garageTab === 'chars' ? 'head' : garageTab === 'wheels' ? 'wheel' : garageTab === 'gliders' ? 'glider' : 'kart';
    const img = thumb(garageTab + it.id + (garageTab === 'chars' ? '' : S.look.paint + S.look.char), garageTab === 'chars' ? { char: it.id, body: 'classic', wheels: 'std', paint: S.look.paint, glider: 'chute' } : look, view);
    return `<button class="card ${on ? 'on' : ''} ${owned ? '' : 'locked'}" data-id="${it.id}"><img src="${img}" alt=""><b>${esc(it.n)}</b>${owned ? (it.w ? `<small>${it.w}</small>` : '<small>&nbsp;</small>') : `<small class="price">🔒 ${it.price} 🪙</small>`}</button>`; }).join('');
  const ch = charById(S.look.char);
  show(`<div class="topBar"><button class="back" data-go="title">◀</button><h2>${next ? 'PICK YOUR RACER' : 'GARAGE'}</h2>${coinsBadge()}</div>
    <div class="garageInfo"><div class="gName">${esc(ch.n)}<small>${esc(ch.d)}</small></div><div class="stats">${bar('Speed', st.spd)}${bar('Accel', st.acc)}${bar('Handling', st.han)}${bar('Weight', st.wt)}</div></div>
    <div class="garageBottom"><div class="tabs">${TABS.map(([id, n]) => `<button data-tab="${id}" class="${garageTab === id ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="cards ${garageTab === 'paint' ? 'paints' : ''}">${cards}</div>
    <button class="go" id="gDone">${next ? "LET'S RACE! ▶" : 'DONE ✔'}</button></div>`, 'screen garage', (root) => {
    root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { sfx('click'); garageTab = b.dataset.tab; garage(next); }));
    root.querySelectorAll('[data-paint]').forEach((b) => b.addEventListener('click', () => { sfx('click'); S.look.paint = b.dataset.paint; persist(); G.showroom.setLook(S.look); garage(next); }));
    root.querySelectorAll('.card').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.id; const it = tabDef[2].find((x) => x.id === id);
      if (!S.unl[garageTab].includes(id)) { if (S.coins >= it.price) { if (confirm(`Unlock ${it.n} for ${it.price} coins?`)) { S.coins -= it.price; S.unl[garageTab].push(id); sfx('buy'); toast(`🎉 ${it.n} unlocked!`); } else return; } else { sfx('wrong'); toast(`Need ${it.price - S.coins} more coins - win races to earn them!`, true); return; } }
      S.look[lookKey[garageTab]] = id; persist(); sfx('click'); G.showroom.setLook(S.look); garage(next); }));
    root.querySelector('#gDone').addEventListener('click', () => { sfx('click'); if (next) next(); else toTitle(); });
    const cs = root.querySelector('.cards .on'); if (cs) cs.scrollIntoView({ inline: 'center', block: 'nearest' });
  });
}

/* ---------------- mode flow ---------------- */
function modeFlow(mode) { garage(() => pickTrack(mode)); }
function trophyIcon(t) { return t === 1 ? '🥇' : t === 2 ? '🥈' : t === 3 ? '🥉' : ''; }
function pickTrack(mode) {
  const diffSeg = mode === 'tt' ? '' : `<h3>CPU LEVEL</h3>${seg('sDiff', Object.keys(DIFF).map((k) => [k, DIFF[k].n]), S.opts.diff)}`;
  if (mode === 'gp') {
    show(`<div class="topBar"><button class="back" id="bBack">◀</button><h2>GRAND PRIX</h2>${coinsBadge()}</div>
      <div class="cupRow">${CUPS.map((c) => `<button class="cup" data-cup="${c.id}"><span class="cupIc">${c.ic}</span><b>${c.n}</b><small>${c.tracks.map((t) => esc(trackById(t).n)).join('<br>')}</small><span class="troph">${['easy', 'normal', 'hard'].map((d) => trophyIcon((S.cups[c.id] || {})[d]) || '·').join(' ')}</span></button>`).join('')}</div>${diffSeg}`, 'screen pick', (root) => {
      root.querySelector('#bBack').addEventListener('click', () => modeFlow(mode)); bindSeg(root, 'sDiff', (v) => { S.opts.diff = v; persist(); });
      root.querySelectorAll('[data-cup]').forEach((b) => b.addEventListener('click', () => { sfx('click'); startGP(b.dataset.cup); })); });
    return;
  }
  if (mode === 'battle') {
    let bm = 'battle', ar = ARENAS[0].id;
    show(`<div class="topBar"><button class="back" id="bBack">◀</button><h2>BATTLE</h2>${coinsBadge()}</div>
      <h3>GAME</h3>${seg('sBm', [['battle', '🎈 Balloon Battle'], ['coins', '🪙 Coin Runners']], bm)}<p class="sub" id="bmTxt">Pop rivals' balloons with items. Last kart with balloons wins!</p>
      <h3>ARENA</h3>${seg('sAr', ARENAS.map((a) => [a.id, a.n]), ar)}${diffSeg}<button class="go" id="bGo">START ▶</button>`, 'screen pick', (root) => {
      root.querySelector('#bBack').addEventListener('click', () => modeFlow(mode)); bindSeg(root, 'sDiff', (v) => { S.opts.diff = v; persist(); });
      bindSeg(root, 'sBm', (v) => { bm = v; root.querySelector('#bmTxt').textContent = v === 'coins' ? 'Grab the most coins in 2 minutes. Getting hit drops half your coins!' : "Pop rivals' balloons with items. Last kart with balloons wins!"; });
      bindSeg(root, 'sAr', (v) => { ar = v; });
      root.querySelector('#bGo').addEventListener('click', () => { sfx('click'); startRace(soloCfg(bm, ar, 6)); }); });
    return;
  }
  let cpus = 7;
  show(`<div class="topBar"><button class="back" id="bBack">◀</button><h2>${mode === 'tt' ? 'TIME TRIAL' : 'VS RACE'}</h2>${coinsBadge()}</div>
    <div class="trackGrid">${TRACKS.map((t) => `<button class="trk th-${t.theme}" data-t="${t.id}"><b>${esc(t.n)}</b><small>${mode === 'tt' ? (S.best[t.id] ? '⏱ ' + fmtTime(S.best[t.id]) + (S.ghosts[t.id] ? ' 👻' : '') : 'no time yet') : CUPS[t.cup].ic + ' ' + CUPS[t.cup].n}</small></button>`).join('')}</div>
    ${mode === 'vs' ? `<h3>CPU RACERS</h3>${seg('sCpu', [[0, '0'], [3, '3'], [5, '5'], [7, '7']], cpus)}` : '<p class="sub">Start with a Triple Turbo. Your best run is saved as a ghost to race next time!</p>'}${diffSeg}`, 'screen pick', (root) => {
    root.querySelector('#bBack').addEventListener('click', () => modeFlow(mode)); bindSeg(root, 'sDiff', (v) => { S.opts.diff = v; persist(); }); bindSeg(root, 'sCpu', (v) => { cpus = +v; });
    root.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { sfx('click'); startRace(soloCfg(mode, b.dataset.t, mode === 'tt' ? 0 : cpus)); })); });
}
function cpuRoster(n, exclude, seed) {
  const R = rng(seed); const pool = CHARS.filter((c) => !exclude.includes(c.id)).map((c) => c.id); const out = [];
  for (let i = 0; i < n; i++) { const ch = pool.length ? pool.splice((R() * pool.length) | 0, 1)[0] : CHARS[(R() * CHARS.length) | 0].id; const c = charById(ch);
    out.push({ name: c.n, ctrl: 'cpu', look: { char: ch, body: BODIES[(R() * BODIES.length) | 0].id, wheels: WHEELS[(R() * WHEELS.length) | 0].id, glider: GLIDERS[(R() * GLIDERS.length) | 0].id, paint: PAINTS[(R() * PAINTS.length) | 0] } }); }
  return out;
}
function myName() { return S.name || charById(S.look.char).n; }
function soloCfg(mode, track, cpus) {
  const seed = (Math.random() * 1e9) | 0;
  const racers = [{ name: myName(), ctrl: 'human', look: Object.assign({}, S.look) }].concat(cpuRoster(cpus, [S.look.char], seed));
  return { mode, track, diff: S.opts.diff, seed, racers, me: 0, ghostRecord: mode === 'tt' };
}
G.soloCfg = soloCfg;
function startGP(cupId) {
  const cup = CUPS.find((c) => c.id === cupId); const seed = (Math.random() * 1e9) | 0;
  const racers = [{ name: myName(), ctrl: 'human', look: Object.assign({}, S.look) }].concat(cpuRoster(RACERS - 1, [S.look.char], seed));
  G.session = { type: 'gp', cup, idx: 0, racers, points: racers.map(() => 0), diff: S.opts.diff, history: [] };
  nextGPRace();
}
G.startGP = startGP;
function nextGPRace() { const s = G.session; startRace({ mode: 'gp', track: s.cup.tracks[s.idx], diff: s.diff, seed: (Math.random() * 1e9) | 0, racers: s.racers, me: 0, gpRace: s.idx + 1 }); }

/* ---------------- race lifecycle ---------------- */
function clearRaceScene() {
  if (G.view) { G.view.dispose(); G.view = null; }
  if (G.W) { G.W.grp.removeFromParent(); G.W.grp.traverse((o) => { if (o.geometry && !o.isInstancedMesh) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); }); G.W = null; }
  if (G.showroom) { G.showroom.dispose(); G.showroom = null; }
  if (G.hud) { G.hud.hide(); G.hud = null; }
  G.race = null;
}
function hideRaceUI() { $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); }
function startRace(cfg) {
  closeUI(); G.state = 'loading'; $('loading').classList.remove('gone'); $('loadTxt').textContent = 'Building ' + (cfg.mode === 'battle' || cfg.mode === 'coins' ? (ARENAS.find((a) => a.id === cfg.track) || ARENAS[0]).n : trackById(cfg.track).n) + '…'; $('loadBar').style.width = '40%';
  setTimeout(() => {
    clearRaceScene(); stopMusic();
    const r = new Race(cfg); r.guest = !!cfg.guest; G.me = cfg.me || 0;
    const theme = r.battle ? r.arenaDef.theme : r.T.theme; setEnvironment(THEMES[theme].env);
    const W = r.battle ? buildArenaWorld(r.world.arena, E.scene, E.quality) : buildWorld(r.D, E.scene, E.quality);
    r.attachWorld(W); G.W = W; G.race = r;
    if (cfg.mode === 'tt') { const k = r.karts[0]; k.item = 'turbo3'; k.itemQty = 3; }
    G.view = new RaceView(r, W, { me: G.me }); G.hud = new HUD(r, G.me);
    if (cfg.mode === 'tt' && S.ghosts[cfg.track]) G.view.setGhost(S.ghosts[cfg.track].f, S.ghosts[cfg.track].look);
    r.cbs.fx = (t, x, y, z) => G.view && G.view.onFx(t, x, y, z); r.cbs.flash = (t) => onFlash(t); r.cbs.event = (k, ev) => onEvent(k, ev);
    G.state = 'race'; G.paused = false; acc = 0;
    $('hud').classList.remove('hidden'); $('touch').classList.remove('hidden'); $('hPause').style.display = '';
    $('loadBar').style.width = '100%'; setTimeout(() => $('loading').classList.add('gone'), 150);
    music(theme === 'haunted' || theme === 'volcano' ? 'spooky' : theme === 'space' ? 'space' : 'sunny');
    const nm = r.battle ? (r.mode === 'coins' ? '🪙 COIN RUNNERS' : '🎈 BALLOON BATTLE') : (cfg.gpRace ? `${G.session.cup.n} · Race ${cfg.gpRace}/4` : '') ;
    G.hud.big(`<div class="trackName">${esc(r.battle ? r.arenaDef.n : r.T.n)}</div>${nm ? `<div class="sub2">${esc(nm)}</div>` : ''}<div class="hint">${IN.mode === 'tilt' ? 'Tilt to steer' : 'Hold DRIFT when “2” disappears for a rocket start!'}</div>`, 2.4, 'intro');
  }, 60);
}
G.startRace = startRace;
function onFlash(t) { if (t === 'zap') { document.body.classList.add('zapflash'); setTimeout(() => document.body.classList.remove('zapflash'), 250); sfx('zap'); } if (t === 'boom') sfx('boom'); }
function onEvent(k, ev) {
  const r = G.race; if (!r || !G.hud) return; const me = r.karts[G.me];
  if (G.view) G.view.onEvent(k, ev);
  if (!k) {
    if (ev.startsWith('count')) { G.hud.big(`<span class="cnt">${ev.slice(5)}</span>`, 0.9, 'count'); sfx('count'); }
    else if (ev === 'go') { G.hud.big('<span class="cnt cntgo">GO!</span>', 0.9, 'count'); sfx('go'); }
    else if (ev === 'raceover') { const rr = G.race; setTimeout(() => showResults(rr), 900); }
    return;
  }
  const mine = k === me;
  if (!mine) { if ((ev === 'spin' || ev === 'tumble' || ev === 'balloon') && G.view && (k.x - me.x) ** 2 + (k.z - me.z) ** 2 < 900) sfx(ev === 'balloon' ? 'balloon' : 'bump'); if (ev === 'out' && G.hud) G.hud.msg(`💥 ${k.name} is out!`, 1.4); return; }
  switch (ev) {
    case 'orb': sfx('orb'); break; case 'coin': sfx('coin'); break; case 'itemready': sfx('itemready'); break;
    case 'miniturbo': sfx('miniturbo'); G.hud.msg(['', 'Mini-Turbo!', 'Super Turbo!', 'ULTRA TURBO!'][k.boostLvl] || 'Turbo!', 0.8, 'boost'); break;
    case 'pad': sfx('pad'); break; case 'ramp': case 'glide': sfx('ramp'); break; case 'trick': sfx('trick'); break; case 'trickboost': G.hud.msg('★ TRICK BOOST!', 0.8, 'boost'); sfx('boost'); break;
    case 'land': sfx('land'); break; case 'spin': case 'squash': sfx('spin'); break; case 'tumble': sfx('tumble'); break; case 'bump': case 'bonk': sfx('bump'); break;
    case 'driftlvl': sfx('driftlvl'); break; case 'rocketstart': sfx('boost'); G.hud.msg('🚀 ROCKET START!', 1.2, 'boost'); break; case 'burnout': sfx('burnout'); G.hud.msg('Too early!', 1, 'warn'); break;
    case 'lap': if (k.lap === r.laps) { G.hud.msg('🏁 FINAL LAP!', 1.8, 'final'); sfx('final'); } else { G.hud.msg(`LAP ${k.lap}`, 1.2); sfx('lap'); } break;
    case 'finish': G.hud.big(`<span class="cnt fin">FINISH!</span><div class="sub2">${ord(k.place)} place!</div>`, 3, 'count'); sfx('finish'); break;
    case 'fall': sfx('fall'); break; case 'shieldpop': sfx('shieldpop'); break; case 'zapped': G.hud.msg('⚡ ZAPPED!', 1, 'warn'); break; case 'splatted': sfx('splat'); break;
    case 'balloon': sfx('balloon'); break; case 'out': G.hud.msg('💥 Out of balloons!', 2, 'warn'); break;
    case 'use_nova': sfx('nova'); break; case 'use_turbo': case 'use_turbo3': sfx('boost'); break; case 'use_puck': case 'use_seeker': case 'use_boom': case 'use_slime': sfx('shoot'); break; case 'use_magnet': sfx('coin'); break;
  }
}
G.onEvent = onEvent;

function togglePause(force) {
  if (G.state !== 'race') return;
  G.paused = force != null ? force : !G.paused;
  if (G.paused) {
    show(`<h2>PAUSED</h2><button class="go" id="pRes">▶ RESUME</button>${G.race.cfg.online ? '' : '<button class="mbtn2" id="pRe">↺ RESTART</button>'}<button class="mbtn2" id="pOpt">⚙️ OPTIONS</button><button class="mbtn2" id="pHow">❓ HOW TO PLAY</button><button class="mbtn2 warn" id="pQuit">✖ QUIT</button>`, 'panel pause', (root) => {
      root.querySelector('#pRes').addEventListener('click', () => togglePause(false));
      const re = root.querySelector('#pRe'); if (re) re.addEventListener('click', () => { const c = Object.assign({}, G.race.cfg); startRace(c); });
      root.querySelector('#pOpt').addEventListener('click', () => options(true)); root.querySelector('#pHow').addEventListener('click', () => howto(false, true));
      root.querySelector('#pQuit').addEventListener('click', () => { if (G.race && G.race.cfg.online) Net.leave(); G.session = null; toTitle(); }); });
  } else closeUI();
}
G.togglePause = togglePause;

/* ---------------- results ---------------- */
function rewardFor(res, mode) { if (mode === 'tt') return 3; const bonus = mode === 'battle' || mode === 'coins' ? [12, 8, 5, 3, 2, 2] : [12, 8, 6, 4, 3, 2, 2, 2]; return (bonus[res.place - 1] || 2) + Math.min(15, res.coins || 0); }
function showResults(which) {
  const r = G.race; if (!r || G.state !== 'race' || (which && which !== r)) return; if (!r.results) r.finish(); G.state = 'results'; $('touch').classList.add('hidden'); $('hPause').style.display = 'none';
  const res = r.results, mine = res.find((x) => x.slot === G.me) || res[0]; const mode = r.mode;
  const earned = rewardFor(mine, mode); S.coins += earned; S.stats.races++; if (mine.place === 1) S.stats.wins++;
  let extra = '';
  if (mode === 'tt' && r.karts[G.me].finished) { const t = r.karts[G.me].finishTime, prev = S.best[r.cfg.track]; if (!prev || t < prev) { S.best[r.cfg.track] = t; S.ghosts[r.cfg.track] = { f: r.ghostRec, look: Object.assign({}, r.karts[G.me].look), t }; extra = `<div class="newRec">⭐ NEW RECORD! ${fmtTime(t)}<br><small>Your ghost is saved 👻</small></div>`; } else extra = `<div class="sub">Best: ${fmtTime(prev)} · You: ${fmtTime(t)}</div>`; }
  let gpTable = '';
  if (G.session && mode === 'gp') { const s = G.session; res.forEach((x) => { s.points[x.slot] += GP_POINTS[x.place - 1] || 0; }); s.idx++;
    const order = s.points.map((p, i) => i).sort((a, b) => s.points[b] - s.points[a]);
    gpTable = `<h3>CUP STANDINGS</h3><div class="tbl">${order.map((i, p) => `<div class="row ${i === G.me ? 'me' : ''}"><span class="pl">${p + 1}</span><img src="${thumb('chars' + s.racers[i].look.char, { char: s.racers[i].look.char, body: 'classic', wheels: 'std', paint: s.racers[i].look.paint, glider: 'chute' }, 'head')}"><span class="nm">${esc(s.racers[i].name)}</span><span class="pts">${s.points[i]} pts</span></div>`).join('')}</div>`; }
  persist();
  const isBattle = mode === 'battle' || mode === 'coins';
  const rows = res.map((x) => `<div class="row ${x.slot === G.me ? 'me' : ''} ${x.ctrl !== 'cpu' && x.slot !== G.me ? 'friend' : ''}"><span class="pl">${x.place}</span><img src="${thumb('chars' + x.look.char, { char: x.look.char, body: 'classic', wheels: 'std', paint: x.look.paint, glider: 'chute' }, 'head')}"><span class="nm">${esc(x.name)}</span><span class="pts">${isBattle ? (mode === 'coins' ? x.bcoins + ' 🪙' : (x.balloons > 0 ? '🎈'.repeat(x.balloons) : '💥') + ' ' + x.score + ' pops') : (x.est ? '~' : '') + fmtTime(x.time)}${mode === 'gp' ? ` <em>+${GP_POINTS[x.place - 1] || 0}</em>` : ''}</span></div>`).join('');
  const gpDone = G.session && mode === 'gp' && G.session.idx >= 4;
  const online = r.cfg.online;
  show(`<h2 class="resTitle">${mine.place === 1 ? '🏆 YOU WIN!' : ord(mine.place).toUpperCase() + ' PLACE'}</h2>${extra}<div class="tbl">${rows}</div>${gpTable}
    <div class="earn">+${earned} 🪙 <small>(total ${S.coins})</small></div>
    <div class="btnRow">${online ? (r.guest ? '<p class="sub">Waiting for the host…</p><button class="mbtn2" id="rQuit">LEAVE</button>' : '<button class="go" id="rLobby">BACK TO ROOM ▶</button>') : gpDone ? '<button class="go" id="rCup">SEE TROPHY 🏆</button>' : mode === 'gp' ? '<button class="go" id="rNext">NEXT RACE ▶</button><button class="mbtn2" id="rQuit">QUIT CUP</button>' : '<button class="go" id="rAgain">↺ AGAIN</button><button class="mbtn2" id="rQuit">MENU</button>'}</div>`, 'panel results', (root) => {
    const on = (id, f) => { const b = root.querySelector('#' + id); if (b) b.addEventListener('click', () => { sfx('click'); f(); }); };
    on('rNext', () => nextGPRace()); on('rAgain', () => startRace(Object.assign({}, r.cfg, { seed: (Math.random() * 1e9) | 0 }))); on('rQuit', () => { if (online) Net.leave(); G.session = null; toTitle(); });
    on('rCup', () => cupScreen()); on('rLobby', () => Net.backToLobby());
  });
}
G.showResults = showResults;
function cupScreen() {
  const s = G.session; const order = s.points.map((p, i) => i).sort((a, b) => s.points[b] - s.points[a]); const place = order.indexOf(G.me) + 1;
  const cups = S.cups[s.cup.id] = S.cups[s.cup.id] || {}; if (place <= 3 && (!cups[s.diff] || place < cups[s.diff])) cups[s.diff] = place; const bonus = place === 1 ? 40 : place === 2 ? 25 : place === 3 ? 15 : 5; S.coins += bonus; persist();
  sfx('finish'); if (G.view) G.view.fx.confetti(G.race.karts[G.me].x, G.race.karts[G.me].y, G.race.karts[G.me].z, 200);
  show(`<div class="trophy t${place}">${place === 1 ? '🏆' : place === 2 ? '🥈' : place === 3 ? '🥉' : '🎗️'}</div><h2>${esc(s.cup.n)}</h2><div class="sub">${DIFF[s.diff].n} · ${ord(place)} overall · ${s.points[G.me]} points</div>
    <div class="podium">${order.slice(0, 3).map((i, p) => `<div class="pod p${p + 1}"><img src="${thumb('chars' + s.racers[i].look.char, { char: s.racers[i].look.char, body: 'classic', wheels: 'std', paint: s.racers[i].look.paint, glider: 'chute' }, 'head')}"><b>${esc(s.racers[i].name)}</b><i>${p + 1}</i></div>`).join('')}</div>
    <div class="earn">Cup bonus +${bonus} 🪙</div><button class="go" id="cDone">AWESOME! ▶</button>`, 'panel cupDone', (root) => root.querySelector('#cDone').addEventListener('click', () => { G.session = null; toTitle(); }));
}

/* ---------------- options + how-to ---------------- */
function options(fromPause) {
  const o = S.opts;
  show(`<div class="topBar"><button class="back" id="oBack">◀</button><h2>OPTIONS</h2></div>
    <h3>GRAPHICS</h3>${seg('oQ', [['high', '✨ HIGH'], ['low', '⚡ LOW']], E.quality)}<div class="opt"><div>Auto quality<small>Switch to LOW if the game gets slow</small></div>${tog('oAQ', o.autoQ !== false)}</div>
    <h3>STEERING</h3>${seg('oSt', [['buttons', '◀ ▶ Buttons'], ['drag', '👆 Drag'], ['tilt', '📱 Tilt']], o.steer)}
    <div class="opt"><div>Auto-accelerate<small>The kart drives itself forward, you just steer</small></div>${tog('oAuto', o.auto)}</div>
    <h3>SOUND</h3><div class="opt"><div>Sound effects</div>${tog('oSnd', o.sound)}</div><div class="opt"><div>Music</div>${tog('oMus', o.music)}</div>
    <h3>NAME</h3><input id="oName" maxlength="12" placeholder="${esc(charById(S.look.char).n)}" value="${esc(S.name || '')}">
    <button class="mbtn2 warn" id="oReset">Reset save data</button>`, 'screen options', (root) => {
    root.querySelector('#oBack').addEventListener('click', () => { S.name = (root.querySelector('#oName').value || '').replace(/[<>&"]/g, '').slice(0, 12); persist(); if (fromPause) togglePause(true); else toTitle(); });
    bindSeg(root, 'oQ', (v) => { o.quality = v; setQuality(v); persist(); });
    bindTog(root, 'oAQ', (v) => { o.autoQ = v; E.autoQ = v; persist(); });
    bindSeg(root, 'oSt', async (v) => { o.steer = v; if (v === 'tilt') { const ok = await enableTilt(); if (!ok) toast('Tilt not available - using buttons', true); } setControlMode(v, o.auto); persist(); });
    bindTog(root, 'oAuto', (v) => { o.auto = v; setControlMode(o.steer, v); persist(); });
    bindTog(root, 'oSnd', (v) => { o.sound = v; setSound(o.sound, o.music); persist(); });
    bindTog(root, 'oMus', (v) => { o.music = v; setSound(o.sound, o.music); persist(); });
    root.querySelector('#oReset').addEventListener('click', () => { if (confirm('Erase coins, unlocks and records?')) { resetSave(); location.reload(); } });
  });
}
function howto(first, fromPause) {
  const items = Object.keys(ITEMS).map((id) => `<div class="itm"><img src="${itemIcon(id)}"><div><b>${ITEMS[id].n}</b><small>${ITEMS[id].d}</small></div></div>`).join('');
  show(`<h2>HOW TO PLAY</h2>
    <div class="howGrid">
      <div class="how"><span>◀ ▶</span><div><b>Steer</b><small>Buttons, drag or tilt (pick in Options). Keyboard: arrows / WASD</small></div></div>
      <div class="how"><span>🚀</span><div><b>Auto-gas</b><small>Your kart speeds up by itself. ◼ brakes / reverses</small></div></div>
      <div class="how"><span>DRIFT</span><div><b>Hop + Drift</b><small>Hold DRIFT and steer in a turn. Sparks go blue → orange → purple. Let go for a turbo! (Space)</small></div></div>
      <div class="how"><span>★</span><div><b>Tricks</b><small>Tap DRIFT in the air off a ramp for a boost when you land</small></div></div>
      <div class="how"><span>ITEM</span><div><b>Items</b><small>Drive through glowing orbs, then tap ITEM (X key)</small></div></div>
      <div class="how"><span>3·2·1</span><div><b>Rocket start</b><small>Hold DRIFT right as “2” disappears</small></div></div>
      <div class="how"><span>🪙</span><div><b>Coins</b><small>Each coin makes you a bit faster (max 10) and buys new racers & karts</small></div></div>
      <div class="how"><span>➚</span><div><b>Shortcuts & pads</b><small>Rainbow pads boost you. Look for dirt shortcuts!</small></div></div>
    </div><h3>ITEMS</h3><div class="itemList">${items}</div><button class="go" id="hDone">GOT IT! ▶</button>`, 'panel howto', (root) => root.querySelector('#hDone').addEventListener('click', () => { if (fromPause) togglePause(true); else toTitle(); }));
}

boot();
