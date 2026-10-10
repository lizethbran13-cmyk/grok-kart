// Synth audio: engine hum, punchy SFX, upbeat chiptune-ish music loops per theme.
export const SND = { ctx: null, on: true, music: true, master: null, mus: null, eng: null };
export function initAudio() {
  if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
  try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const c = SND.ctx; SND.master = c.createGain(); SND.master.gain.value = SND.on ? 0.6 : 0; SND.master.connect(c.destination);
  SND.mus = c.createGain(); SND.mus.gain.value = SND.music ? 0.22 : 0; SND.mus.connect(SND.master);
  SND.sfx = c.createGain(); SND.sfx.gain.value = 0.8; SND.sfx.connect(SND.master);
}
export function setSound(on, music) { SND.on = on; SND.music = music; if (SND.master) SND.master.gain.value = on ? 0.6 : 0; if (SND.mus) SND.mus.gain.value = music ? 0.22 : 0; }
function tone(f, d, type = 'square', vol = 0.3, slide = 0, delay = 0, dest) {
  const c = SND.ctx; if (!c) return; const t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(dest || SND.sfx); o.start(t); o.stop(t + d + 0.02);
}
function noise(d, vol = 0.3, f = 1200, delay = 0) {
  const c = SND.ctx; if (!c) return; const t = c.currentTime + delay; const n = c.sampleRate * d, b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; const g = c.createGain(); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(SND.sfx); s.start(t);
}
export function sfx(name) {
  if (!SND.ctx || !SND.on) return;
  switch (name) {
    case 'count': tone(440, 0.25, 'square', 0.25); break;
    case 'go': tone(880, 0.5, 'square', 0.3); tone(1320, 0.5, 'triangle', 0.2); break;
    case 'orb': tone(660, 0.08, 'square', 0.15); tone(990, 0.12, 'square', 0.15, 0, 0.06); break;
    case 'roll': tone(500 + Math.random() * 500, 0.04, 'square', 0.08); break;
    case 'itemready': tone(1200, 0.1, 'triangle', 0.2); tone(1600, 0.15, 'triangle', 0.2, 0, 0.08); break;
    case 'coin': tone(1320, 0.06, 'square', 0.15); tone(1760, 0.18, 'square', 0.15, 0, 0.06); break;
    case 'boost': case 'pad': tone(200, 0.5, 'sawtooth', 0.2, 500); noise(0.4, 0.15, 3000); break;
    case 'miniturbo': tone(300, 0.35, 'sawtooth', 0.18, 600); break;
    case 'driftlvl': tone(900, 0.07, 'square', 0.12); break;
    case 'spin': tone(700, 0.6, 'triangle', 0.25, -500); break;
    case 'tumble': case 'boom': noise(0.7, 0.5, 900); tone(120, 0.5, 'sine', 0.4, -80); break;
    case 'bump': case 'bonk': tone(140, 0.12, 'sine', 0.3, -60); break;
    case 'ramp': case 'glide': tone(400, 0.3, 'triangle', 0.15, 400); break;
    case 'trick': tone(800, 0.08, 'square', 0.15); tone(1200, 0.12, 'square', 0.15, 0, 0.07); break;
    case 'land': noise(0.15, 0.2, 600); break;
    case 'lap': [660, 880, 1100].forEach((f, i) => tone(f, 0.15, 'square', 0.2, 0, i * 0.1)); break;
    case 'final': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.16, 'square', 0.2, 0, i * 0.11)); break;
    case 'finish': [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.25, 'square', 0.22, 0, i * 0.12)); break;
    case 'shoot': tone(600, 0.15, 'square', 0.18, -300); break;
    case 'zap': tone(1800, 0.6, 'sawtooth', 0.2, -1600); noise(0.3, 0.2, 5000); break;
    case 'shieldpop': tone(1000, 0.2, 'sine', 0.2, 800); break;
    case 'splat': noise(0.3, 0.3, 500); tone(200, 0.3, 'sine', 0.2, -100); break;
    case 'fall': tone(800, 0.8, 'triangle', 0.2, -700); break;
    case 'click': tone(900, 0.05, 'square', 0.12); break;
    case 'buy': [784, 988, 1318].forEach((f, i) => tone(f, 0.12, 'square', 0.18, 0, i * 0.08)); break;
    case 'nova': [523, 659, 784, 988, 1175, 1318].forEach((f, i) => tone(f, 0.1, 'square', 0.15, 0, i * 0.05)); break;
    case 'balloon': tone(900, 0.15, 'sine', 0.25, -600); noise(0.1, 0.3, 4000); break;
    case 'burnout': noise(0.6, 0.25, 400); break;
    case 'wrong': tone(300, 0.2, 'square', 0.15); tone(250, 0.3, 'square', 0.15, 0, 0.2); break;
  }
}
// engine hum for the local kart
export function engine(speed, boost, on) {
  const c = SND.ctx; if (!c) return;
  if (!SND.eng) { const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g); g.connect(SND.sfx); o.start(); o2.start(); SND.eng = { o, o2, f, g }; }
  const e = SND.eng, t = c.currentTime, s = Math.abs(speed);
  e.o.frequency.setTargetAtTime(55 + s * 4.2 + (boost ? 40 : 0), t, 0.08); e.o2.frequency.setTargetAtTime(27 + s * 2.1, t, 0.08); e.f.frequency.setTargetAtTime(300 + s * 25, t, 0.1);
  e.g.gain.setTargetAtTime(on && SND.on ? 0.05 + Math.min(0.07, s * 0.002) : 0, t, 0.1);
}
// music: tiny step sequencer
const SONGS = {
  sunny: { bpm: 140, root: 60, prog: [0, 5, 7, 5], scale: [0, 2, 4, 7, 9], lead: 'square' },
  spooky: { bpm: 120, root: 57, prog: [0, 3, 5, 3], scale: [0, 3, 5, 7, 10], lead: 'triangle' },
  space: { bpm: 132, root: 62, prog: [0, 7, 5, 3], scale: [0, 2, 3, 7, 9], lead: 'sawtooth' },
  menu: { bpm: 118, root: 64, prog: [0, 5, 3, 4], scale: [0, 2, 4, 7, 9], lead: 'triangle' },
};
let seq = null;
export function music(song) {
  stopMusic(); const c = SND.ctx; if (!c || !SONGS[song]) return;
  const S = SONGS[song], step = 60 / S.bpm / 2; let i = 0, next = c.currentTime + 0.1; const rnd = (n) => { let x = Math.sin(n * 91.7 + S.root) * 10000; return x - Math.floor(x); };
  const mel = []; for (let k = 0; k < 32; k++) mel.push(rnd(k) < 0.7 ? S.scale[(rnd(k + 50) * S.scale.length) | 0] + (rnd(k + 9) < 0.3 ? 12 : 0) : null);
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  seq = setInterval(() => { while (next < c.currentTime + 0.25) { const bar = Math.floor(i / 8) % 4, ch = S.prog[bar], dl = next - c.currentTime;
      if (i % 2 === 0) tone(hz(S.root - 24 + ch + (i % 4 === 2 ? 12 : 0)), step * 1.6, 'triangle', 0.5, 0, dl, SND.mus);
      const m = mel[i % 32]; if (m != null) tone(hz(S.root + ch + m), step * 0.9, S.lead, 0.18, 0, dl, SND.mus);
      if (i % 4 === 0) { tone(150, 0.12, 'sine', 0.5, -100, dl, SND.mus); } if (i % 4 === 2) { const cc = SND.ctx; } i++; next += step; } }, 60);
}
export function stopMusic() { if (seq) { clearInterval(seq); seq = null; } }
