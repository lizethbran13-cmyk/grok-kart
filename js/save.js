// localStorage save: coins, unlocks, look, options, records, ghosts, trophies.
const KEY = 'grokKart.v1';
const DEF = () => ({ coins: 30, name: '', unl: { chars: ['grok', 'martina', 'chinchino', 'blaze'], bodies: ['classic', 'bubble'], wheels: ['std', 'slick'], gliders: ['chute'] },
  look: { char: 'grok', body: 'classic', wheels: 'std', glider: 'chute', paint: '#ff3b5c' },
  opts: { quality: 'high', autoQ: true, steer: 'buttons', auto: true, sound: true, music: true, diff: 'normal', laps: 3 }, best: {}, ghosts: {}, cups: {}, stats: { races: 0, wins: 0 }, seenHow: false });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(); return Object.assign(d, s, { unl: Object.assign(d.unl, s.unl || {}), look: Object.assign(d.look, s.look || {}), opts: Object.assign(d.opts, s.opts || {}) }); } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { // ghosts are the big part: drop them if storage is full
  S.ghosts = {}; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (x) {} return false; } }
export function resetSave() { S = DEF(); persist(); return S; }
export function reload() { S = load(); return S; }
