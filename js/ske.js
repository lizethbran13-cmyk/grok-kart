// Super Kart Expansion (DLC #28): Ratita Staff ghosts, Time Trial medals and the Ratita Challenge Ladder.
// Staff ghosts are real recorded laps (js/staff/<track>.json), fetched only when a Time Trial needs them.
import { DLC, TRACKS, trackById, charById } from './data.js';
import { S, persist } from './save.js';

const V = new URL(import.meta.url).search || '';
// medal = how close you got to the Ratita Staff time (3 laps)
export const MEDALS = [null, { n: 'Bronze', ic: '🥉', f: 1.25, coins: 10 }, { n: 'Silver', ic: '🥈', f: 1.12, coins: 20 }, { n: 'Gold', ic: '🥇', f: 1.04, coins: 35 }, { n: 'Ratita Star', ic: '💎', f: 1.0, coins: 60 }];
// who drives each Staff ghost (and with which kart)
export const STAFF_DRV = {
  city: ['luna', 'wedge', 'star', '#19c3ff'], canyon: ['pirat', 'monster', 'big', '#ff8a1f'], candy: ['snowie', 'bubble', 'star', '#ff4fd8'], beach: ['candy', 'classic', 'slick', '#ffd60a'],
  castle: ['pirat', 'rocket', 'neon', '#b04dff'], frost: ['snowie', 'wedge', 'slick', '#f5f5f5'], lava: ['candy', 'monster', 'big', '#ff3b5c'], space: ['luna', 'rocket', 'neon', '#5b6cff'],
  ratlab: ['luna', 'wedge', 'neon', '#00d1b2'], garden: ['martina', 'tub', 'star', '#2ee86d'] };
export function staffLook(id) { const d = STAFF_DRV[id] || STAFF_DRV.city; return { char: d[0], body: d[1], wheels: d[2], glider: 'wing', paint: d[3] }; }
export const STAFF = {}; // id -> { t, laps[], f (15 Hz frames), look }
const pending = {};
export function loadStaff(id) {
  if (STAFF[id]) return Promise.resolve(STAFF[id]); if (pending[id]) return pending[id];
  return (pending[id] = fetch(new URL('./staff/' + id + '.json' + V, import.meta.url)).then((r) => r.ok ? r.json() : null).then((j) => { if (!j || !j.d) return null; return (STAFF[id] = { t: j.t, laps: j.laps, f: decode(j.d), look: staffLook(id) }); }).catch(() => null).finally(() => { delete pending[id]; }));
}
// 7.5 Hz delta-encoded ints -> 15 Hz frames [x, y, z, yaw, steer]
export function decode(d) {
  const n = d.length / 5, raw = []; let x = 0, y = 0, z = 0, w = 0;
  for (let i = 0; i < n; i++) { x += d[i * 5]; y += d[i * 5 + 1]; z += d[i * 5 + 2]; w += d[i * 5 + 3]; raw.push([x / 10, y / 10, z / 10, w / 100, d[i * 5 + 4] / 10]); }
  const out = []; for (let i = 0; i < raw.length; i++) { out.push(raw[i]); const b = raw[i + 1]; if (b) { const a = raw[i]; out.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, (a[3] + b[3]) / 2, a[4]]); } }
  return out;
}
export function encode(frames) { // dev: 15 Hz frames -> 7.5 Hz deltas (yaw unwrapped)
  const out = []; let px = 0, py = 0, pz = 0, pw = 0, uw = null;
  for (let i = 0; i < frames.length; i += 2) { const f = frames[i]; let yaw = f[3]; if (uw != null) { while (yaw - uw > Math.PI) yaw -= Math.PI * 2; while (yaw - uw < -Math.PI) yaw += Math.PI * 2; } uw = yaw;
    const X = Math.round(f[0] * 10), Y = Math.round(f[1] * 10), Z = Math.round(f[2] * 10), W = Math.round(yaw * 100); out.push(X - px, Y - py, Z - pz, W - pw, Math.round(f[4] * 10)); px = X; py = Y; pz = Z; pw = W; }
  return out;
}
// staff times (3 laps, seconds) baked from the recorded ghosts so menus can show medals without downloading them
// raw autopilot recordings; the Ratita Staff drive them 6% quicker (ghosts are played back at 1/STAFF_PACE speed to match)
export const STAFF_PACE = 0.94;
const STAFF_RAW = {"city":{"t":103.55,"laps":[36.48,70.8,103.55]},"canyon":{"t":113.63,"laps":[37.73,75.32,113.63]},"candy":{"t":96.32,"laps":[31.2,66.22,96.32]},"beach":{"t":93.3,"laps":[30.93,61.58,93.3]},"castle":{"t":90.58,"laps":[32.77,61.92,90.58]},"frost":{"t":110.53,"laps":[36.55,75.85,110.53]},"lava":{"t":106.72,"laps":[36.67,73.2,106.72]},"space":{"t":94.25,"laps":[31.68,62.95,94.25]},"ratlab":{"t":128.48,"laps":[44.47,86.87,128.48]},"garden":{"t":121.68,"laps":[42.02,81.43,121.68]}};
export const STAFF_T = {}; for (const k in STAFF_RAW) STAFF_T[k] = { t: +(STAFF_RAW[k].t * STAFF_PACE).toFixed(2), laps: STAFF_RAW[k].laps.map((x) => +(x * STAFF_PACE).toFixed(2)) };
export function medalFor(id, t) { const st = STAFF_T[id] && STAFF_T[id].t; if (!st || !t) return 0; for (let m = 4; m >= 1; m--) if (t <= st * MEDALS[m].f + 1e-6) return m; return 0; }
export function medalTarget(id, m) { const st = STAFF_T[id] && STAFF_T[id].t; return st ? st * MEDALS[m].f : null; }

// ---- Ratita Challenge Ladder: 10 rungs, beat each rival's ghost to climb ----
export const LADDER = [
  { track: 'city', rival: 'snowie', f: 1.38, laps: 1, rule: '', coins: 20, line: 'Snowie: "First rung! I\'ll go easy on you… maybe."' },
  { track: 'beach', rival: 'martina', f: 1.32, laps: 1, rule: '', coins: 20, line: 'Torty: "Slow and steady? Not today, Torty has a turbo shell!"' },
  { track: 'canyon', rival: 'pirat', f: 1.31, laps: 1, rule: 'noturbo', coins: 25, line: 'Pi-rat: "No turbos, matey! Just you, the road and me."' },
  { track: 'candy', rival: 'candy', f: 1.21, laps: 3, rule: '', coins: 25, line: 'Candy: "Woof! Zoomies mode: ON! 🐾"' },
  { track: 'garden', rival: 'martina', f: 1.16, laps: 3, rule: '', coins: 30, line: 'Martina: "Welcome to my garden! Mind the snails, they bite."' },
  { track: 'frost', rival: 'snowie', f: 1.16, laps: 3, rule: 'noturbo', coins: 30, line: 'Snowie: "Ice is my home turf. And no turbos for you!"' },
  { track: 'castle', rival: 'pirat', f: 1.08, laps: 3, rule: '', coins: 35, line: 'Pi-rat: "Arr, this castle be haunted… by my fast laps!"' },
  { track: 'ratlab', rival: 'luna', f: 1.05, laps: 3, rule: '', coins: 40, line: 'Luna: "My lab, my rules. I calculated a 0.0% chance you win."' },
  { track: 'lava', rival: 'candy', f: 1.07, laps: 3, rule: 'noturbo', coins: 45, line: 'Candy: "Hot paws! Hot paws! No turbos on lava!"' },
  { track: 'space', rival: 'luna', f: 1.0, laps: 3, rule: '', coins: 100, boss: 1, line: 'BOSS - Luna in the Ratita Rocket: "Beat my Staff ghost and you\'re a Ratita legend!"' },
];
export function rungTarget(r) { const st = STAFF_T[r.track]; if (!st) return null; const base = r.laps === 1 ? st.laps[0] : st.t; return base * r.f; }
export function rivalLook(r) { const L = staffLook(r.track); const c = charById(r.rival); return { char: r.rival, body: L.body, wheels: L.wheels, glider: 'wing', paint: r.rival === 'martina' ? '#2ee86d' : L.paint, _c: c.id }; }
export function ladderState() { if (!S.ladder || typeof S.ladder !== 'object') S.ladder = { next: 0, best: {}, champ: false }; return S.ladder; }
export function owned() { return DLC.ok(); }
export function dlcTrack(id) { const t = trackById(id); return !!(t && t.dlc); }
export function tracksForTT() { return TRACKS; }
export function saveMedal(id, t) { if (!S.medals) S.medals = {}; const m = medalFor(id, t), prev = S.medals[id] || 0; if (m > prev) { S.medals[id] = m; let c = 0; for (let k = prev + 1; k <= m; k++) c += MEDALS[k].coins; S.coins += c; persist(); return { m, prev, coins: c }; } return { m: prev, prev, coins: 0 }; }
