// Offscreen thumbnails of racers / kart parts for menus (rendered once with the main renderer).
import * as THREE from 'three';
import { E } from './engine.js';
import { makeKart } from './models.js';

const cache = {};
let sc = null, cam = null, rt = null;
function setup() {
  if (sc) return; sc = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  sc.add(new THREE.HemisphereLight(0xffffff, 0xb0a0ff, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 2.5); d.position.set(3, 5, 6); sc.add(d);
  rt = new THREE.WebGLRenderTarget(160, 160, { samples: 4 });
}
export function thumb(key, look, view) {
  if (cache[key]) return cache[key];
  setup(); const K = makeKart(look); sc.add(K.root); K.shadow.visible = false;
  if (view === 'head') { K.root.rotation.y = Math.PI + 0.35; K.root.updateMatrixWorld(true); const p = new THREE.Vector3(); K.headG.getWorldPosition(p); cam.position.set(p.x + 0.2, p.y + 0.15, p.z - 2.6); cam.lookAt(p.x, p.y - 0.05, p.z); K.wheels.forEach((w) => (w.piv.visible = false)); }
  else if (view === 'wheel') { K.root.rotation.y = Math.PI / 2; K.root.updateMatrixWorld(true); const p = new THREE.Vector3(); K.wheels[1].piv.getWorldPosition(p); cam.position.set(p.x + 0.4, p.y + 0.4, p.z + 1.9); cam.lookAt(p); }
  else if (view === 'glider') { K.glider.visible = true; K.glider.scale.setScalar(1); K.root.rotation.y = Math.PI * 0.85; cam.position.set(4, 4, -7.5); cam.lookAt(0, 1.6, 0); }
  else { K.root.rotation.y = Math.PI * 0.8; cam.position.set(4.2, 2.8, -5.5); cam.lookAt(0, 0.7, 0); }
  const r = E.renderer; const prevT = r.toneMapping; r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(sc, cam);
  const buf = new Uint8Array(160 * 160 * 4); r.readRenderTargetPixels(rt, 0, 0, 160, 160, buf); r.setRenderTarget(null); r.toneMapping = prevT;
  const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'); const img = g.createImageData(160, 160);
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const s = ((159 - y) * 160 + x) * 4, d = (y * 160 + x) * 4; for (let k = 0; k < 3; k++) img.data[d + k] = Math.min(255, Math.pow(buf[s + k] / 255, 1 / 2.2) * 255); img.data[d + 3] = buf[s + 3]; }
  g.putImageData(img, 0, 0); K.root.removeFromParent();
  return (cache[key] = c.toDataURL());
}
