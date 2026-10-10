import * as THREE from 'three';
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export const wrapAng = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export const $ = (id) => document.getElementById(id);
export function fmtTime(t) { if (t == null || !isFinite(t)) return '--:--.--'; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); }
export const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
export const ordS = (n) => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

// procedural canvas textures (generated once, high-res, mipmapped, anisotropic)
const texCache = {};
export function canvasTex(key, size, draw, opts = {}) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  texCache[key] = t; return t;
}
export function noiseFill(g, size, base, vary, count, rad, r) {
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const R = r || Math.random;
  for (let i = 0; i < count; i++) {
    const v = (R() - 0.5) * vary; const a = R() * 0.5 + 0.2;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${(v * a).toFixed(3)})` : `rgba(0,0,0,${(-v * a).toFixed(3)})`;
    const s = rad * (0.3 + R());
    g.fillRect(R() * size, R() * size, s, s);
  }
}
export function toast(msg, bad) {
  const t = $('toast'); if (!t) return;
  const d = document.createElement('div'); d.className = 'tst' + (bad ? ' bad' : ''); d.textContent = msg; t.appendChild(d);
  setTimeout(() => d.classList.add('out'), 2400); setTimeout(() => d.remove(), 2900);
}
