// GPU particle pools (soft round sprites): drift sparks, boost flames, dust, smoke, confetti, weather.
import * as THREE from 'three';

const VS = `attribute float size; attribute vec4 col; varying vec4 vC; uniform float scale;
void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position,1.0); vC.a *= smoothstep(2.0, 6.0, -mv.z); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`;
const FS = `varying vec4 vC; uniform float soft; void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p); if (d > 0.5) discard; float a = smoothstep(0.5, soft, d); gl_FragColor = vec4(vC.rgb, vC.a * a); }`;

class Pool {
  constructor(n, additive, soft) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.col = new Float32Array(n * 4); this.size = new Float32Array(n); this.life = new Float32Array(n); this.max = new Float32Array(n); this.s0 = new Float32Array(n); this.s1 = new Float32Array(n); this.grav = new Float32Array(n); this.drag = new Float32Array(n); this.a0 = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('col', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { scale: { value: 400 }, soft: { value: soft } } });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = 5;
  }
  emit(x, y, z, vx, vy, vz, r, g, b, a, life, s0, s1, grav, drag) {
    const i = this.i; this.i = (this.i + 1) % this.n;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = a; this.a0[i] = a;
    this.life[i] = life; this.max[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.grav[i] = grav || 0; this.drag[i] = drag || 0; this.size[i] = s0;
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) { if (this.life[i] <= 0) { this.size[i] = 0; continue; }
      this.life[i] -= dt; const t = 1 - this.life[i] / this.max[i]; const dr = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= dr; this.vel[i * 3 + 2] *= dr; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dr - this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * t; this.col[i * 4 + 3] = this.a0[i] * (1 - t * t); }
    const g = this.pts.geometry; g.attributes.position.needsUpdate = true; g.attributes.col.needsUpdate = true; g.attributes.size.needsUpdate = true;
  }
}
export class FX {
  constructor(scene, low) { this.add = new Pool(low ? 700 : 1600, true, 0.1); this.norm = new Pool(low ? 500 : 1200, false, 0.25); scene.add(this.add.pts, this.norm.pts); this.weather = null; this.low = low; }
  setScale(h) { this.add.mat.uniforms.scale.value = h * 0.9; this.norm.mat.uniforms.scale.value = h * 0.9; }
  dispose() { this.add.pts.removeFromParent(); this.norm.pts.removeFromParent(); }
  update(dt, cam) { this.add.update(dt); this.norm.update(dt); if (this.weather) this.weather(dt, cam); }
  spark(x, y, z, lvl, dirx, dirz) { const c = lvl >= 3 ? [0.9, 0.4, 1.4] : lvl === 2 ? [1.4, 0.65, 0.15] : lvl === 1 ? [0.35, 0.8, 1.5] : [1, 1, 0.8];
    for (let i = 0; i < 2; i++) this.add.emit(x, y, z, (Math.random() - 0.5) * 6 + dirx * 2, 2 + Math.random() * 3, (Math.random() - 0.5) * 6 + dirz * 2, c[0], c[1], c[2], 1, 0.3 + Math.random() * 0.2, 0.45, 0.1, 14, 2); }
  flame(x, y, z, vx, vz, lvl) { const c = lvl >= 3 ? [1.0, 0.45, 1.3] : lvl === 2 ? [1.4, 0.6, 0.15] : [0.4, 0.8, 1.5]; this.add.emit(x, y, z, vx + (Math.random() - 0.5), 0.6 + Math.random(), vz + (Math.random() - 0.5), c[0], c[1], c[2], 0.9, 0.22, 0.9, 0.2, -2, 3); }
  dust(x, y, z, r, g, b) { this.norm.emit(x + (Math.random() - 0.5), y + 0.2, z + (Math.random() - 0.5), (Math.random() - 0.5) * 2, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 2, r, g, b, 0.4, 0.6, 0.5, 1.4, -0.5, 1.5); }
  smoke(x, y, z, n = 10, c = [0.95, 0.95, 1]) { for (let i = 0; i < n; i++) this.norm.emit(x + (Math.random() - 0.5) * 2, y + 0.3, z + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 5, 1 + Math.random() * 3, (Math.random() - 0.5) * 5, c[0], c[1], c[2], 0.55, 0.8, 0.8, 2.2, -0.5, 2.5); }
  burst(x, y, z, n, cols, sp = 8, life = 0.8, size = 0.8) { for (let i = 0; i < n; i++) { const c = cols[(Math.random() * cols.length) | 0]; const a = Math.random() * 6.28, e = Math.random() * 1.5; this.add.emit(x, y, z, Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp + 2, Math.sin(a) * Math.cos(e) * sp, c[0], c[1], c[2], 1, life * (0.6 + Math.random() * 0.6), size, 0.1, 9, 1.5); } }
  confetti(x, y, z, n = 60) { const cols = [[1, 0.3, 0.6], [0.3, 0.9, 1], [1, 0.9, 0.2], [0.4, 1, 0.4], [0.8, 0.5, 1]]; for (let i = 0; i < n; i++) { const c = cols[(Math.random() * 5) | 0]; this.norm.emit(x + (Math.random() - 0.5) * 6, y + 4 + Math.random() * 3, z + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8, 4 + Math.random() * 6, (Math.random() - 0.5) * 8, c[0], c[1], c[2], 1, 2.5, 0.35, 0.3, 5, 1.2); } }
  explosion(x, y, z) { this.burst(x, y + 1, z, this.low ? 30 : 70, [[1.5, 0.7, 0.2], [1.5, 0.3, 0.1], [1.4, 1.2, 0.4]], 14, 0.7, 1.6); this.smoke(x, y, z, 18, [0.5, 0.45, 0.5]); }
  setWeather(kind) {
    this.weather = null; if (!kind) return; let acc = 0;
    const cfg = { snow: [[1, 1, 1], 0.55, -3, 50, false], embers: [[1.5, 0.6, 0.15], 0.35, 2.5, 25, true], stars: [[0.8, 0.9, 1.5], 0.3, 0, 18, true], petals: [[1, 0.6, 0.85], 0.4, -1.5, 18, false], fireflies: [[0.6, 1.4, 0.8], 0.35, 0.4, 14, true] }[kind];
    if (!cfg) return; const [c, s, vy, rate, add] = cfg; const pool = add ? this.add : this.norm;
    this.weather = (dt, cam) => { acc += dt * rate * (this.low ? 0.5 : 1); while (acc > 1) { acc--; const x = cam.position.x + (Math.random() - 0.5) * 70, z = cam.position.z + (Math.random() - 0.5) * 70, y = cam.position.y + (vy < 0 ? 18 : -4) + Math.random() * 6; pool.emit(x, y, z, (Math.random() - 0.5) * 1.5, vy + (Math.random() - 0.5), (Math.random() - 0.5) * 1.5, c[0], c[1], c[2], 0.9, 6, s, s, 0, 0); } };
  }
}
