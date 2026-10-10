// HUD: position, laps, timer, coins, item roulette, minimap, banners, splat overlay, battle balloons.
import { $, fmtTime, ordS } from './util.js';
import { ITEMS } from './data.js';
import { minimap } from './track.js';

const ICONS = {};
export function itemIcon(id) {
  if (ICONS[id]) return ICONS[id];
  // crisp vector icons drawn on canvas (original designs)
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round';
  const circ = (x, y, r, f, s, w) => { g.beginPath(); g.arc(x, y, r, 0, 7); if (f) { g.fillStyle = f; g.fill(); } if (s) { g.lineWidth = w || 6; g.strokeStyle = s; g.stroke(); } };
  switch (id) {
    case 'turbo': case 'turbo3': { const draw = (ox, oy, sc) => { g.save(); g.translate(ox, oy); g.scale(sc, sc); g.rotate(-0.6); g.fillStyle = '#ff3b5c'; g.beginPath(); g.ellipse(0, 0, 16, 34, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -8, 8, 0, 7); g.fill(); g.fillStyle = '#19c3ff'; g.beginPath(); g.arc(0, -8, 5, 0, 7); g.fill(); g.fillStyle = '#ffd60a'; g.beginPath(); g.moveTo(-10, 30); g.lineTo(0, 54); g.lineTo(10, 30); g.fill(); g.fillStyle = '#ff8a1f'; g.beginPath(); g.moveTo(-16, 18); g.lineTo(-26, 34); g.lineTo(-12, 30); g.fill(); g.beginPath(); g.moveTo(16, 18); g.lineTo(26, 34); g.lineTo(12, 30); g.fill(); g.restore(); };
      if (id === 'turbo') draw(64, 60, 1.2); else { draw(40, 70, 0.8); draw(88, 70, 0.8); draw(64, 46, 0.85); } break; }
    case 'slime': g.fillStyle = '#39e75f'; g.beginPath(); g.ellipse(64, 80, 46, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(64, 64, 30, 28, 0, 0, 7); g.fill(); circ(52, 60, 9, '#fff'); circ(76, 60, 9, '#fff'); circ(54, 62, 4, '#111'); circ(78, 62, 4, '#111'); break;
    case 'puck': case 'seeker': { const col = id === 'puck' ? '#19c3ff' : '#ff3b5c'; g.fillStyle = col; g.beginPath(); g.ellipse(64, 70, 48, 26, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(64, 76, 48, 22, 0, 0, Math.PI); g.fill(); g.strokeStyle = id === 'puck' ? '#fff' : '#ffe14d'; g.lineWidth = 6; g.beginPath(); g.ellipse(64, 66, 28, 14, 0, 0, 7); g.stroke(); if (id === 'seeker') { g.strokeStyle = '#fff'; g.lineWidth = 5; circ(64, 30, 14, null, '#fff', 5); g.beginPath(); g.moveTo(64, 10); g.lineTo(64, 50); g.moveTo(44, 30); g.lineTo(84, 30); g.stroke(); } break; }
    case 'boom': g.fillStyle = '#7c3aed'; g.beginPath(); g.roundRect(22, 38, 84, 62, 14); g.fill(); circ(46, 70, 14, '#111'); circ(82, 70, 14, '#111'); circ(46, 70, 6, '#555'); circ(82, 70, 6, '#555'); g.strokeStyle = '#333'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 38); g.quadraticCurveTo(70, 18, 88, 16); g.stroke(); circ(90, 15, 8, '#ffb000'); break;
    case 'shield': { const gr = g.createRadialGradient(50, 48, 6, 64, 64, 50); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#9be7ff'); gr.addColorStop(1, '#b26bff'); circ(64, 64, 48, gr); circ(48, 46, 10, 'rgba(255,255,255,0.8)'); break; }
    case 'zap': g.fillStyle = '#ffe14d'; g.strokeStyle = '#ff8a1f'; g.lineWidth = 6; g.beginPath(); g.moveTo(74, 10); g.lineTo(34, 70); g.lineTo(60, 70); g.lineTo(48, 118); g.lineTo(96, 52); g.lineTo(68, 52); g.closePath(); g.fill(); g.stroke(); break;
    case 'splat': g.fillStyle = '#b026ff'; g.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, r = i % 2 ? 30 : 48; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.fill(); circ(52, 58, 8, '#fff'); circ(76, 58, 8, '#fff'); circ(53, 60, 4, '#111'); circ(77, 60, 4, '#111'); break;
    case 'nova': { g.save(); g.translate(64, 64); const gr = g.createLinearGradient(-50, -50, 50, 50); gr.addColorStop(0, '#ff4fd8'); gr.addColorStop(0.5, '#ffe14d'); gr.addColorStop(1, '#3ff0ff'); g.fillStyle = gr; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - Math.PI / 2, r = i % 2 ? 22 : 54; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); circ(54, 62, 5, '#111'); circ(74, 62, 5, '#111'); break; }
    case 'magnet': g.lineWidth = 22; g.strokeStyle = '#ff3b5c'; g.beginPath(); g.arc(64, 60, 30, Math.PI, 0); g.stroke(); g.lineWidth = 22; g.beginPath(); g.moveTo(34, 60); g.lineTo(34, 92); g.moveTo(94, 60); g.lineTo(94, 92); g.stroke(); g.strokeStyle = '#e5e7eb'; g.beginPath(); g.moveTo(34, 92); g.lineTo(34, 108); g.moveTo(94, 92); g.lineTo(94, 108); g.stroke(); circ(64, 104, 10, '#ffc81a'); break;
  }
  if (id === 'turbo3') { g.fillStyle = '#fff'; g.font = 'bold 30px Arial'; g.fillText('x3', 86, 118); }
  return (ICONS[id] = c.toDataURL());
}

export class HUD {
  constructor(race, me, opts = {}) {
    this.race = race; this.me = me; this.el = $('hud'); this.el.classList.remove('hidden'); this.el.classList.toggle('battle', !!race.battle);
    this.last = {}; this.map = race.D ? minimap(race.D) : null; this.mapC = $('mapC'); this.mapG = this.mapC.getContext('2d'); this.mapBg = null;
    if (this.map) this.drawMapBg(); else this.mapBg = null;
    $('hLapT').textContent = race.laps || '';
    this.msgT = 0; this.bigT = 0; this.rollT = 0; this.labels = opts.labels || [];
  }
  drawMapBg() {
    const D = this.race.D, m = this.map, c = document.createElement('canvas'); c.width = c.height = 220; const g = c.getContext('2d');
    g.lineJoin = 'round'; g.lineCap = 'round';
    const path = () => { g.beginPath(); for (let i = 0; i <= D.N; i++) { const j = i % D.N; const x = D.X[j] * m.sc + m.ox, y = D.Z[j] * m.sc + m.oz; i ? g.lineTo(x, y) : g.moveTo(x, y); } };
    path(); g.strokeStyle = 'rgba(20,16,43,0.65)'; g.lineWidth = 14; g.stroke(); path(); g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.stroke();
    for (let i = 0; i < D.N; i++) if (D.GAP[i]) { g.fillStyle = '#19c3ff'; g.beginPath(); g.arc(D.X[i] * m.sc + m.ox, D.Z[i] * m.sc + m.oz, 4.5, 0, 7); g.fill(); }
    g.fillStyle = '#111'; g.fillRect(D.X[0] * m.sc + m.ox - 5, D.Z[0] * m.sc + m.oz - 2, 10, 4);
    this.mapBg = c;
  }
  msg(t, dur = 1.6, cls = '') { const e = $('hMsg'); e.textContent = t; e.className = 'show ' + cls; this.msgT = dur; }
  big(t, dur = 1, cls = '') { const e = $('hBig'); e.innerHTML = t; e.className = 'show ' + cls; this.bigT = dur; }
  update(dt) {
    const r = this.race, k = r.karts[this.me]; if (!k) return; const L = this.last;
    const set = (id, v) => { if (L[id] !== v) { L[id] = v; $(id).textContent = v; } };
    if (r.battle) {
      set('hPosN', r.mode === 'coins' ? String(k.coins) : String(k.balloons)); set('hPosS', r.mode === 'coins' ? '🪙' : '🎈');
      set('hTime', fmtTime(Math.max(0, r.timeLimit - r.time)).slice(0, -3));
      const bl = r.ranking().slice(0, 4).map((i) => { const o = r.karts[i]; return (i === this.me ? '<b>' : '') + escName(o.name) + ' ' + (r.mode === 'coins' ? o.coins + '🪙' : (o.out ? '💥' : '🎈'.repeat(o.balloons))) + (i === this.me ? '</b>' : ''); }).join('<br>');
      if (L.bl !== bl) { L.bl = bl; $('hBalloons').innerHTML = bl; }
    } else {
      if (L.bl !== '') { L.bl = ''; $('hBalloons').innerHTML = ''; }
      set('hPosN', String(k.place)); set('hPosS', ordS(k.place)); set('hLapN', String(Math.min(r.laps, Math.max(1, k.lap))));
      set('hTime', fmtTime(k.finished ? k.finishTime : r.time));
    }
    set('hCoinN', String(k.coins));
    // item slot
    let ic = 'none';
    if (k.roulette > 0) { this.rollT += dt; const ids = ['turbo', 'slime', 'puck', 'shield', 'boom', 'seeker', 'magnet', 'nova']; ic = ids[Math.floor(this.rollT * 14) % ids.length]; }
    else if (k.item) ic = k.item === 'turbo3' ? (k.itemQty >= 3 ? 'turbo3' : 'turbo') : k.item;
    if (L.ic !== ic) { L.ic = ic; $('hItemIc').style.backgroundImage = ic === 'none' ? 'none' : `url(${itemIcon(ic)})`; $('hItem').classList.toggle('has', ic !== 'none' && !(k.roulette > 0)); }
    const qty = k.item === 'turbo3' && k.itemQty > 1 && k.itemQty < 3 ? '×' + k.itemQty : ''; set('hItemX', qty);
    $('tItem').classList.toggle('ready', !!k.item && !(k.roulette > 0));
    // drift charge indicator
    const dl = k.driftDir ? ['', 'blue', 'orange', 'purple'][k.driftLvl] || 'charging' : ''; if (L.dl !== dl) { L.dl = dl; $('hDrift').className = dl ? 'show ' + dl : ''; }
    // splat overlay
    const sp = k.splat > 0 ? Math.min(1, k.splat / 1.2) : 0; if (Math.abs((L.sp || 0) - sp) > 0.02) { L.sp = sp; $('hSplat').style.opacity = sp; }
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) $('hMsg').className = ''; }
    if (this.bigT > 0) { this.bigT -= dt; if (this.bigT <= 0) $('hBig').className = ''; }
    if (!r.battle && k.wrong > 1.2 && !k.finished) { if (!L.wrongShown) { this.msg('↩ WRONG WAY!', 1.2, 'warn'); L.wrongShown = true; } } else L.wrongShown = false;
    this.drawMap();
  }
  drawMap() {
    const g = this.mapG, r = this.race; g.clearRect(0, 0, 220, 220);
    if (r.battle) { const A = r.world.arena, s = 100 / A.lim; g.fillStyle = 'rgba(20,16,43,0.45)'; if (A.A.shape === 'round') { g.beginPath(); g.arc(110, 110, 100, 0, 7); g.fill(); } else g.fillRect(10, 10, 200, 200); g.fillStyle = 'rgba(255,255,255,0.5)'; A.obstacles.forEach((o) => { g.beginPath(); g.arc(110 + o[0] * s, 110 + o[1] * s, o[2] * s, 0, 7); g.fill(); });
      r.karts.forEach((k, i) => { if (k.out) return; this.dot(g, 110 + k.x * s, 110 + k.z * s, k, i); }); return; }
    if (this.mapBg) g.drawImage(this.mapBg, 0, 0);
    const m = this.map; const order = r.karts.map((k, i) => i).sort((a, b) => (a === this.me) - (b === this.me));
    order.forEach((i) => { const k = r.karts[i]; this.dot(g, k.x * m.sc + m.ox, k.z * m.sc + m.oz, k, i); });
  }
  dot(g, x, y, k, i) { const me = i === this.me; g.beginPath(); g.arc(x, y, me ? 8 : 5.5, 0, 7); g.fillStyle = k.look.paint || '#fff'; g.fill(); g.lineWidth = me ? 3 : 2; g.strokeStyle = me ? '#ffffff' : (k.ctrl === 'cpu' ? 'rgba(0,0,0,0.6)' : '#ffe14d'); g.stroke(); }
  hide() { this.el.classList.add('hidden'); $('hMsg').className = ''; $('hBig').className = ''; $('hSplat').style.opacity = 0; $('hDrift').className = ''; }
}
function escName(s) { return String(s).replace(/[<>&"]/g, ''); }
