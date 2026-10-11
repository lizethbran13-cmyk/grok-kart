// Visual themes: bright, saturated cartoon palettes + procedural PBR textures.
import * as THREE from 'three';
import { canvasTex, noiseFill, rng } from './util.js';

export const THEMES = {
  city: { env: { skyTop: 0x2f8cff, skyMid: 0x8fd8ff, skyBot: 0xd9f4ff, fog: 0xbfe9ff, fogD: 0.0013, sunDir: [0.5, 0.75, 0.35], sunColor: 0xfff1d6, sunI: 2.4, hemiSky: 0xd8f0ff, hemiGround: 0x8ccf6a, hemiI: 1.05, exposure: 1.05, sunDisc: 1, envI: 0.9, clouds: 0xffffff },
    road: 'asphalt', curb: [0xff3b5c, 0xffffff], ground: 'grass', wall: [0xffd60a, 0x2563eb], decor: 'city' },
  desert: { env: { skyTop: 0x1f8fff, skyMid: 0x9fe0ff, skyBot: 0xffe1b0, fog: 0xffdcb0, fogD: 0.0013, sunDir: [0.3, 0.8, -0.5], sunColor: 0xffe7c2, sunI: 2.6, hemiSky: 0xfff0d8, hemiGround: 0xe0a060, hemiI: 1.0, exposure: 1.05, sunDisc: 1, envI: 0.9, clouds: 0xfff6e8 },
    road: 'sandroad', curb: [0xff6a00, 0xfff3d6], ground: 'sand', wall: [0xff7a3d, 0xffd166], decor: 'desert' },
  candy: { env: { skyTop: 0xd94bff, skyMid: 0xff7fd0, skyBot: 0xffd0ef, fog: 0xffb8e6, fogD: 0.0011, sunDir: [-0.4, 0.8, 0.4], sunColor: 0xfff0f8, sunI: 2.2, hemiSky: 0xffe8ff, hemiGround: 0xff9ad0, hemiI: 0.95, exposure: 0.98, sunDisc: 0.8, envI: 1.0, clouds: 0xfff0fa },
    road: 'candy', curb: [0xff2e88, 0xffffff], ground: 'frosting', wall: [0xff4fd8, 0x7cf7ff], decor: 'candy' },
  beach: { env: { skyTop: 0x0090ff, skyMid: 0x5fd8ff, skyBot: 0xc8f4ff, fog: 0xa8ecff, fogD: 0.0010, sunDir: [0.6, 0.7, 0.2], sunColor: 0xfff4d8, sunI: 2.5, hemiSky: 0xe8fbff, hemiGround: 0xf2d99a, hemiI: 1.1, exposure: 1.06, sunDisc: 1, envI: 0.95, clouds: 0xffffff },
    road: 'boardwalk', curb: [0x00c2ff, 0xffffff], ground: 'sand', wall: [0x22d3ee, 0xff7ab6], decor: 'beach' },
  haunted: { env: { skyTop: 0x2a1460, skyMid: 0x7a3fc4, skyBot: 0xff8fb8, fog: 0x7c4bc0, fogD: 0.0042, sunDir: [-0.5, 0.55, -0.6], sunColor: 0xd8c8ff, sunI: 1.7, hemiSky: 0xc8b0ff, hemiGround: 0x4a7a5a, hemiI: 1.0, exposure: 1.15, moon: 1, stars: 0.6, envI: 0.9, envLight: 0xd0b8ff },
    road: 'cobble', curb: [0xff8a1f, 0x3b0764], ground: 'spookgrass', wall: [0x8b5cf6, 0xff8a1f], decor: 'haunted' },
  snow: { env: { skyTop: 0x1f6fff, skyMid: 0x7cc4ff, skyBot: 0xd8f0ff, fog: 0xbfe2ff, fogD: 0.0011, sunDir: [0.4, 0.6, 0.6], sunColor: 0xfffaf0, sunI: 2.2, hemiSky: 0xeef8ff, hemiGround: 0x9cc8ff, hemiI: 0.9, exposure: 0.92, sunDisc: 0.9, envI: 1.0, clouds: 0xffffff },
    road: 'icy', curb: [0x2563eb, 0xffffff], ground: 'snow', wall: [0x38bdf8, 0xffffff], decor: 'snow' },
  volcano: { env: { skyTop: 0x5a1a6a, skyMid: 0xff5a3a, skyBot: 0xffc070, fog: 0xff8a5a, fogD: 0.0032, sunDir: [0.2, 0.6, -0.7], sunColor: 0xffd0a0, sunI: 2.0, hemiSky: 0xffc8a0, hemiGround: 0xff5020, hemiI: 1.0, exposure: 1.1, sunDisc: 0.6, envI: 0.9, envLight: 0xffc090 },
    road: 'basalt', curb: [0xffd000, 0x262626], ground: 'ash', wall: [0xff6a00, 0x3f3f46], decor: 'volcano' },
  space: { env: { skyTop: 0x0a0630, skyMid: 0x2a1a7a, skyBot: 0x6a2aa0, fog: 0x2a1a6a, fogD: 0.0012, sunDir: [0.4, 0.7, 0.3], sunColor: 0xe8e0ff, sunI: 2.2, hemiSky: 0xb8a8ff, hemiGround: 0x4a2a8a, hemiI: 1.1, exposure: 1.1, stars: 1.2, nebula: 0xff4fd8, envI: 1.0, envLight: 0xc0b0ff },
    road: 'neon', curb: [0x00e5ff, 0xff4fd8], ground: null, wall: [0x00e5ff, 0xff4fd8], decor: 'space' },
  // Super Kart Expansion
  lab: { env: { skyTop: 0x2b2a9e, skyMid: 0x8a63ff, skyBot: 0xffb3d1, fog: 0xc79cff, fogD: 0.0016, sunDir: [-0.45, 0.62, 0.45], sunColor: 0xffe2c8, sunI: 2.3, hemiSky: 0xd8ccff, hemiGround: 0x5fd0b0, hemiI: 1.1, exposure: 1.06, sunDisc: 0.8, stars: 0.25, envI: 1.0, envLight: 0xe0d0ff, clouds: 0xffd6f0 },
    road: 'labroad', curb: [0xffd60a, 0x1e1b4b], ground: 'labfloor', wall: [0x22e5ff, 0xffd60a], decor: 'lab' },
  garden: { env: { skyTop: 0x1c8bff, skyMid: 0x86dcff, skyBot: 0xfff0c2, fog: 0xc9f0ff, fogD: 0.0012, sunDir: [0.55, 0.78, 0.25], sunColor: 0xfff0cc, sunI: 2.5, hemiSky: 0xe6f8ff, hemiGround: 0x7fd36a, hemiI: 1.1, exposure: 1.05, sunDisc: 1, envI: 0.95, clouds: 0xffffff },
    road: 'brick', curb: [0xff7a1a, 0xfff7e0], ground: 'lawn', wall: [0x22c55e, 0xff7ab6], decor: 'garden' },
};

// heightmap canvas -> tangent-space normal map
function normalFrom(srcCanvas, strength) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const src = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const out = g.createImageData(w, h); const d = out.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1); const k = (y * w + x) * 4;
    d[k] = (-dx / l * 0.5 + 0.5) * 255; d[k + 1] = (dy / l * 0.5 + 0.5) * 255; d[k + 2] = (1 / l * 0.5 + 0.5) * 255; d[k + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; return t;
}
function heightCanvas(size, draw) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); return c; }

// ---------- road textures (u across road 0..1, v along 8 m) ----------
const roadCache = {};
export function roadMaterial(style) {
  if (roadCache[style]) return roadCache[style];
  const R = rng(7);
  const S = 512;
  let color, hgt, emis = null, rough = 0.75, metal = 0.0;
  const lines = (g, edge, center, dash) => {
    g.fillStyle = edge; g.fillRect(S * 0.03, 0, S * 0.022, S); g.fillRect(S * 0.948, 0, S * 0.022, S);
    if (center) { g.fillStyle = center; for (let y = 0; y < S; y += S / 2) g.fillRect(S * 0.493, y + (dash ? S * 0.1 : 0), S * 0.014, dash ? S * 0.28 : S / 2); }
  };
  if (style === 'asphalt' || style === 'icy') {
    color = heightCanvas(S, (g) => { noiseFill(g, S, style === 'icy' ? '#5d6b85' : '#4f5566', 0.5, 9000, 3, R); lines(g, '#ffffff', style === 'icy' ? '#9be7ff' : '#ffd60a', true);
      if (style === 'icy') { for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(235,248,255,0.35)'; g.beginPath(); g.ellipse(R() < 0.5 ? R() * S * 0.12 : S - R() * S * 0.12, R() * S, 10 + R() * 26, 6 + R() * 12, 0, 0, 7); g.fill(); } } });
    hgt = heightCanvas(S, (g) => noiseFill(g, S, '#808080', 1.0, 14000, 2, R)); rough = style === 'icy' ? 0.35 : 0.8;
  } else if (style === 'sandroad') {
    color = heightCanvas(S, (g) => { noiseFill(g, S, '#d99a5b', 0.45, 9000, 4, R); g.fillStyle = 'rgba(120,60,20,0.18)'; g.fillRect(S * 0.25, 0, S * 0.08, S); g.fillRect(S * 0.67, 0, S * 0.08, S); lines(g, '#fff3d6', null); });
    hgt = heightCanvas(S, (g) => noiseFill(g, S, '#808080', 1.2, 12000, 3, R)); rough = 0.9;
  } else if (style === 'candy') {
    color = heightCanvas(S, (g) => { g.fillStyle = '#ff7cc4'; g.fillRect(0, 0, S, S); for (let x = 0; x < S; x += S / 8) { g.fillStyle = (x / (S / 8)) % 2 ? '#ff95d1' : '#ff6fbd'; g.fillRect(x, 0, S / 8, S); }
      const sp = ['#ffffff', '#ffe14d', '#3ff0ff', '#7cff6b', '#b26bff']; for (let i = 0; i < 260; i++) { g.save(); g.translate(R() * S, R() * S); g.rotate(R() * 3); g.fillStyle = sp[(R() * 5) | 0]; g.fillRect(-5, -1.6, 10, 3.2); g.restore(); }
      g.fillStyle = '#fff'; g.fillRect(0, 0, S * 0.05, S); g.fillRect(S * 0.95, 0, S * 0.05, S); });
    hgt = heightCanvas(S, (g) => { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); for (let x = 0; x < S; x += S / 8) { const gr = g.createLinearGradient(x, 0, x + S / 8, 0); gr.addColorStop(0, '#606060'); gr.addColorStop(0.5, '#a0a0a0'); gr.addColorStop(1, '#606060'); g.fillStyle = gr; g.fillRect(x, 0, S / 8, S); } });
    rough = 0.35; // glossy frosting
  } else if (style === 'boardwalk') {
    color = heightCanvas(S, (g) => { for (let y = 0; y < S; y += 32) { const l = 70 + R() * 18; g.fillStyle = `hsl(32,${55 + R() * 15}%,${l * 0.85}%)`; g.fillRect(0, y, S, 30); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(120,70,30,0.12)'; g.fillRect(R() * S, y + R() * 28, 30 + R() * 80, 1.5); } g.fillStyle = '#6b4423'; g.fillRect(0, y + 30, S, 2); g.fillStyle = '#555'; g.fillRect(S * 0.2, y + 12, 5, 5); g.fillRect(S * 0.8, y + 12, 5, 5); }
      g.fillStyle = '#00c2ff'; g.fillRect(0, 0, S * 0.03, S); g.fillRect(S * 0.97, 0, S * 0.03, S); });
    hgt = heightCanvas(S, (g) => { for (let y = 0; y < S; y += 32) { g.fillStyle = '#9a9a9a'; g.fillRect(0, y, S, 30); g.fillStyle = '#202020'; g.fillRect(0, y + 30, S, 2); } });
    rough = 0.7;
  } else if (style === 'cobble') {
    const stones = []; for (let y = 0; y < S; y += 42) for (let x = -20; x < S + 20; x += 52) stones.push([x + ((y / 42) % 2) * 26 + (R() - 0.5) * 8, y + 21 + (R() - 0.5) * 6, 22 + R() * 4, 17 + R() * 3, R()]);
    color = heightCanvas(S, (g) => { g.fillStyle = '#3a2a4f'; g.fillRect(0, 0, S, S); stones.forEach(([x, y, a, b, r]) => { g.fillStyle = `hsl(${265 + r * 30},${22 + r * 18}%,${42 + r * 16}%)`; g.beginPath(); g.ellipse(x, y, a, b, 0, 0, 7); g.fill(); }); g.fillStyle = '#ff8a1f'; g.fillRect(0, 0, S * 0.025, S); g.fillRect(S * 0.975, 0, S * 0.025, S); });
    hgt = heightCanvas(S, (g) => { g.fillStyle = '#202020'; g.fillRect(0, 0, S, S); stones.forEach(([x, y, a, b]) => { const gr = g.createRadialGradient(x, y, 2, x, y, a); gr.addColorStop(0, '#e0e0e0'); gr.addColorStop(1, '#505050'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, a, b, 0, 0, 7); g.fill(); }); });
    rough = 0.6;
  } else if (style === 'basalt') {
    const cracks = []; for (let i = 0; i < 26; i++) { let x = R() * S, y = R() * S; const seg = [[x, y]]; for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 70; y += (R() - 0.5) * 70; seg.push([x, y]); } cracks.push(seg); }
    const drawCr = (g, col, w) => { g.strokeStyle = col; g.lineWidth = w; cracks.forEach((c) => { g.beginPath(); c.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }); };
    color = heightCanvas(S, (g) => { noiseFill(g, S, '#4a3a44', 0.5, 9000, 3, R); drawCr(g, '#ff7a1a', 4); lines(g, '#ffd000', null); });
    const em = heightCanvas(S, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, S, S); drawCr(g, '#ff6a00', 5); });
    emis = new THREE.CanvasTexture(em); emis.wrapS = emis.wrapT = THREE.RepeatWrapping; emis.colorSpace = THREE.SRGBColorSpace;
    hgt = heightCanvas(S, (g) => { noiseFill(g, S, '#909090', 1.0, 9000, 3, R); drawCr(g, '#202020', 5); }); rough = 0.85;
  } else if (style === 'labroad') { // smooth lab-floor asphalt with glowing lane lights + hazard stripes
    const draw = (g, glow) => { if (!glow) { noiseFill(g, S, '#3b3f5c', 0.35, 7000, 3, R); g.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 0; y < S; y += S / 4) g.fillRect(0, y, S, 3); } else { g.fillStyle = '#000'; g.fillRect(0, 0, S, S); }
      for (let y = 0; y < S; y += 32) { g.fillStyle = (y / 32) % 2 ? '#ffd60a' : (glow ? '#000' : '#1e1b4b'); g.fillRect(0, y, S * 0.035, 32); g.fillRect(S * 0.965, y, S * 0.035, 32); }
      g.fillStyle = '#22e5ff'; g.fillRect(S * 0.05, 0, S * 0.012, S); g.fillRect(S * 0.938, 0, S * 0.012, S);
      for (let y = 0; y < S; y += S / 2) { g.fillStyle = '#ff4fd8'; g.fillRect(S * 0.32, y + S * 0.1, S * 0.012, S * 0.22); g.fillRect(S * 0.668, y + S * 0.1, S * 0.012, S * 0.22); } };
    color = heightCanvas(S, (g) => draw(g, false));
    const em = heightCanvas(S, (g) => draw(g, true));
    emis = new THREE.CanvasTexture(em); emis.wrapS = emis.wrapT = THREE.RepeatWrapping; emis.colorSpace = THREE.SRGBColorSpace;
    hgt = heightCanvas(S, (g) => noiseFill(g, S, '#808080', 0.8, 9000, 2, R)); rough = 0.45; metal = 0.15;
  } else if (style === 'brick') { // warm terracotta garden-path bricks
    const bricks = []; for (let y = 0; y < S; y += 32) for (let x = -32; x < S + 32; x += 64) bricks.push([x + ((y / 32) % 2) * 32, y, R()]);
    color = heightCanvas(S, (g) => { g.fillStyle = '#c9b48a'; g.fillRect(0, 0, S, S); bricks.forEach(([x, y, r]) => { g.fillStyle = `hsl(${12 + r * 16},${55 + r * 15}%,${50 + r * 10}%)`; g.fillRect(x + 2, y + 2, 60, 28); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 4, y + 4, 56, 5); });
      g.fillStyle = '#fff7e0'; g.fillRect(0, 0, S * 0.03, S); g.fillRect(S * 0.97, 0, S * 0.03, S); });
    hgt = heightCanvas(S, (g) => { g.fillStyle = '#303030'; g.fillRect(0, 0, S, S); bricks.forEach(([x, y]) => { g.fillStyle = '#b0b0b0'; g.fillRect(x + 2, y + 2, 60, 28); }); }); rough = 0.75;
  } else if (style === 'neon') {
    color = heightCanvas(S, (g) => { g.fillStyle = '#1b1450'; g.fillRect(0, 0, S, S); g.strokeStyle = '#3b2f9a'; g.lineWidth = 2; for (let x = 0; x <= S; x += S / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); } for (let y = 0; y <= S; y += S / 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); } g.fillStyle = '#00e5ff'; g.fillRect(0, 0, S * 0.04, S); g.fillStyle = '#ff4fd8'; g.fillRect(S * 0.96, 0, S * 0.04, S); g.fillStyle = '#ffffff'; for (let y = 0; y < S; y += S / 2) g.fillRect(S * 0.49, y, S * 0.02, S * 0.25); });
    const em = heightCanvas(S, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.fillStyle = '#00e5ff'; g.fillRect(0, 0, S * 0.04, S); g.fillStyle = '#ff4fd8'; g.fillRect(S * 0.96, 0, S * 0.04, S); g.strokeStyle = '#4433bb'; g.lineWidth = 2; for (let y = 0; y <= S; y += S / 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); } g.fillStyle = '#ffffff'; for (let y = 0; y < S; y += S / 2) g.fillRect(S * 0.49, y, S * 0.02, S * 0.25); });
    emis = new THREE.CanvasTexture(em); emis.wrapS = emis.wrapT = THREE.RepeatWrapping; emis.colorSpace = THREE.SRGBColorSpace;
    hgt = heightCanvas(S, (g) => { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); }); rough = 0.3; metal = 0.4;
  }
  const map = new THREE.CanvasTexture(color); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map, normalMap: normalFrom(hgt, 2.5), roughness: rough, metalness: metal });
  m.normalScale.set(0.7, 0.7);
  if (emis) { m.emissiveMap = emis; m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 1.6; }
  roadCache[style] = m; return m;
}

// ---------- ground textures (world-space UV, ~1 tile per 12 m) ----------
const groundCache = {};
export function groundMaterial(style) {
  if (!style) return null;
  if (groundCache[style]) return groundCache[style];
  const R = rng(11), S = 512;
  const P = {
    grass: ['#5fd35a', 0.35, (g) => { for (let i = 0; i < 3000; i++) { g.fillStyle = R() < 0.5 ? 'rgba(40,140,40,0.35)' : 'rgba(180,255,120,0.3)'; g.fillRect(R() * S, R() * S, 2, 6); } for (let i = 0; i < 40; i++) { g.fillStyle = ['#fff', '#ffe14d', '#ff7ab6'][(R() * 3) | 0]; g.beginPath(); g.arc(R() * S, R() * S, 3, 0, 7); g.fill(); } }, 0.95],
    sand: ['#f7c873', 0.3, (g) => { for (let i = 0; i < 70; i++) { g.strokeStyle = 'rgba(200,140,70,0.18)'; g.lineWidth = 3; g.beginPath(); const y = R() * S; g.moveTo(0, y); g.bezierCurveTo(S / 3, y + 12, S * 2 / 3, y - 12, S, y); g.stroke(); } }, 0.95],
    frosting: ['#7fe8ff', 0.2, (g) => { const sp = ['#ffffff', '#ff4fd8', '#ffe14d', '#7cff6b', '#b26bff']; for (let i = 0; i < 300; i++) { g.save(); g.translate(R() * S, R() * S); g.rotate(R() * 3); g.fillStyle = sp[(R() * 5) | 0]; g.fillRect(-6, -2, 12, 4); g.restore(); } }, 0.45],
    spookgrass: ['#3e8f6a', 0.35, (g) => { for (let i = 0; i < 2500; i++) { g.fillStyle = R() < 0.5 ? 'rgba(20,60,50,0.4)' : 'rgba(140,220,170,0.25)'; g.fillRect(R() * S, R() * S, 2, 6); } }, 0.95],
    snow: ['#e2f0ff', 0.14, (g) => { for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(160,200,255,0.18)'; g.beginPath(); g.ellipse(R() * S, R() * S, 20 + R() * 40, 8 + R() * 14, R() * 3, 0, 7); g.fill(); } }, 0.6],
    ash: ['#5b4652', 0.4, (g) => { for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(255,110,30,0.35)'; g.lineWidth = 2; g.beginPath(); let x = R() * S, y = R() * S; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - 0.5) * 60; y += (R() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); } }, 0.9],
    lawn: ['#58d14e', 0.3, (g) => { for (let i = 0; i < 3200; i++) { g.fillStyle = R() < 0.5 ? 'rgba(30,150,40,0.35)' : 'rgba(200,255,130,0.3)'; g.fillRect(R() * S, R() * S, 2, 7); } for (let x = 0; x < S; x += 64) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, 0, 32, S); } for (let i = 0; i < 70; i++) { g.fillStyle = ['#fff', '#ffe14d', '#ff7ab6', '#b26bff', '#ff8a1f'][(R() * 5) | 0]; g.beginPath(); g.arc(R() * S, R() * S, 3.5, 0, 7); g.fill(); } }, 0.92],
    labfloor: ['#6fe3c4', 0.16, (g) => { for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) { g.fillStyle = (x + y) % 128 ? 'rgba(255,255,255,0.10)' : 'rgba(40,60,200,0.08)'; g.fillRect(x + 3, y + 3, 58, 58); } g.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < S; k += 64) { g.fillRect(k, 0, 2, S); g.fillRect(0, k, S, 2); } for (let i = 0; i < 24; i++) { g.fillStyle = 'rgba(255,214,10,0.5)'; const x = ((R() * 8) | 0) * 64, y = ((R() * 8) | 0) * 64; g.fillRect(x + 28, y + 28, 8, 8); } }, 0.5],
    dirt: ['#b8834f', 0.45, (g) => { for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(90,50,20,0.3)'; g.beginPath(); g.arc(R() * S, R() * S, 1 + R() * 3, 0, 7); g.fill(); } }, 0.95],
  }[style];
  const map = canvasTex('g_' + style, S, (g) => { noiseFill(g, S, P[0], P[1], 12000, 3, R); P[2](g); });
  const h = heightCanvas(256, (g) => noiseFill(g, 256, '#808080', 1, 5000, 3, R));
  const m = new THREE.MeshStandardMaterial({ map, normalMap: normalFrom(h, 2), roughness: P[3], metalness: 0 });
  if (style === 'ash') { m.emissiveMap = map; m.emissive = new THREE.Color(0x401000); }
  groundCache[style] = m; return m;
}

// paint material for props: smooth, saturated, slightly glossy (vertex colours)
let vcMat = null, vcMatGloss = null;
export function vcMaterial(gloss) {
  if (gloss) return vcMatGloss || (vcMatGloss = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.28, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.15 }));
  return vcMat || (vcMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 }));
}
