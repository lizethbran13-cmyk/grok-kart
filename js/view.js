// Race renderer: karts, items, orbs, coins, hazards, ghost, chase camera, particles from physics state.
import * as THREE from 'three';
import { E, followShadow } from './engine.js';
import { makeKart, animateKart } from './models.js';
import { Builder, P, lathe, blob, tube } from './geo.js';
import { vcMaterial } from './themes.js';
import { prop } from './props.js';
import { FX } from './fx.js';
import { hazardPos } from './items.js';
import { damp, wrapAng, clamp } from './util.js';

const PI = Math.PI;
let MODELS = null;
function models() {
  if (MODELS) return MODELS;
  const M = {};
  M.orbShell = new THREE.IcosahedronGeometry(1, 4);
  M.orbMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.55, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [200, 900], clearcoat: 1, emissive: 0x6040ff, emissiveIntensity: 0.25, depthWrite: false });
  { const b = new Builder(); const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 - PI / 2, r = i % 2 ? 0.28 : 0.62; i ? st.lineTo(Math.cos(a) * r, -Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, -Math.sin(a) * r); }
    const g = new THREE.ExtrudeGeometry(st, { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 }); g.translate(0, 0, -0.09); b.add(g, 0xffe14d, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.8); M.orbCore = b.build(); }
  M.coin = (() => { const g = lathe([[0, -0.1], [0.5, -0.1], [0.58, -0.05], [0.6, 0], [0.58, 0.05], [0.5, 0.1], [0, 0.1]], 40); g.rotateX(PI / 2); return g; })();
  M.coinMat = new THREE.MeshStandardMaterial({ color: 0xffc81a, metalness: 0.55, roughness: 0.25, emissive: 0xffa000, emissiveIntensity: 0.45 });
  { const b = new Builder(); b.add(blob(50, 0.12, 3), 0x39e75f, 0, 0.35, 0, 0, 0, 0, 1.1, 0.45, 1.1); b.add(P.sphere, 0x39e75f, 0.5, 0.15, 0.5, 0, 0, 0, 0.35, 0.2, 0.35); b.add(P.sphere, 0x22c55e, -0.6, 0.12, -0.3, 0, 0, 0, 0.3, 0.15, 0.3);
    [-0.25, 0.25].forEach((x) => { b.add(P.sphere, 0xffffff, x, 0.72, 0.3, 0, 0, 0, 0.18); b.add(P.sphere, 0x111111, x, 0.74, 0.44, 0, 0, 0, 0.08); }); M.slime = b.build(); }
  { const b = new Builder(); b.add(lathe([[0, -0.25], [0.8, -0.25], [0.95, -0.1], [0.95, 0.1], [0.8, 0.25], [0, 0.25]], 40), 0x19c3ff); b.add(P.torus, 0xffffff, 0, 0.26, 0, PI / 2, 0, 0, 0.55, 0.55, 0.3, 1.5); b.add(P.sphere, 0x0b5f99, 0, 0.27, 0, 0, 0, 0, 0.35, 0.1, 0.35); M.puck = b.build(); }
  { const b = new Builder(); b.add(lathe([[0, -0.25], [0.8, -0.25], [0.95, -0.1], [0.95, 0.1], [0.8, 0.25], [0, 0.25]], 40), 0xff3b5c); b.add(P.torus, 0xffe14d, 0, 0.26, 0, PI / 2, 0, 0, 0.55, 0.55, 0.3, 1.8); for (let i = 0; i < 3; i++) b.add(P.rboxS, 0xffffff, Math.cos(i * 2.1) * 0.95, 0.3, Math.sin(i * 2.1) * 0.95, 0, -i * 2.1, 0, 0.4, 0.5, 0.08); b.add(P.sphere, 0xffffff, 0, 0.35, 0, 0, 0, 0, 0.25, 0.25, 0.25, 2); M.seeker = b.build(); }
  { const b = new Builder(); b.add(P.rbox, 0x7c3aed, 0, 0.55, 0, 0, 0, 0, 1.4, 1.0, 0.9); [-0.35, 0.35].forEach((x) => { b.add(P.cyl, 0x111111, x, 0.55, 0.46, PI / 2, 0, 0, 0.3, 0.06, 0.3); b.add(P.sphere, 0x444444, x, 0.55, 0.47, 0, 0, 0, 0.14, 0.14, 0.08); });
    b.add(tube([[0, 1.05, 0], [0.15, 1.35, 0], [0.3, 1.45, 0]], 0.04, 10, 6), 0x222222); b.add(P.sphere, 0xffb000, 0.3, 1.47, 0, 0, 0, 0, 0.1, 0.1, 0.1, 3); b.add(P.rboxS, 0xffe14d, 0, 0.95, -0.3, 0, 0, 0, 1.0, 0.08, 0.1); M.boom = b.build(); }
  // hazards
  { const b = new Builder(); b.add(P.rbox, 0xffd60a, 0, 0.9, 0, 0, 0, 0, 2.0, 0.9, 3.6); b.add(P.rbox, 0xffd60a, 0, 1.55, -0.2, 0, 0, 0, 1.8, 0.8, 2.0); b.add(P.rbox, 0x7dd3fc, 0, 1.6, -0.2, 0, 0, 0, 1.85, 0.6, 1.7); b.add(P.rboxS, 0x111111, 0, 2.05, -0.2, 0, 0, 0, 0.9, 0.25, 0.5);
    [[-1, 1.2], [1, 1.2], [-1, -1.2], [1, -1.2]].forEach(([x, z]) => b.add(P.cyl, 0x222222, x, 0.45, z, 0, 0, PI / 2, 0.45, 0.35, 0.45)); [-0.6, 0.6].forEach((x) => b.add(P.sphere, 0xffffff, x, 0.95, 1.8, 0, 0, 0, 0.18, 0.18, 0.08, 2)); M.car = b.build(); }
  { const b = new Builder(); b.add(blob(60, 0.16, 3), 0xb3734a, 0, 0, 0, 0, 0, 0, 2); M.boulder = b.build(); }
  { const b = new Builder(); b.add(blob(61, 0.05, 3), 0xffffff, 0, 0, 0, 0, 0, 0, 2); M.snowball = b.build(); }
  M.ball = prop('beachball');
  { const b = new Builder(); b.add(P.sphere, 0xff3b3b, 0, 0.6, 0, 0, 0, 0, 1.0, 0.55, 0.8); [-1, 1].forEach((s) => { b.add(P.sphere, 0xff3b3b, s * 1.25, 0.8, 0.5, 0, 0, 0, 0.45, 0.35, 0.3); b.add(P.cyl, 0xff3b3b, s * 0.7, 0.7, 0.5, 0, 0, s * 1.0, 0.1, 0.6, 0.1); b.add(P.cyl, 0x111111, s * 0.25, 1.2, 0.4, 0, 0, 0, 0.04, 0.4, 0.04); b.add(P.sphere, 0xffffff, s * 0.25, 1.45, 0.4, 0, 0, 0, 0.14); b.add(P.sphere, 0x111111, s * 0.25, 1.47, 0.52, 0, 0, 0, 0.06); for (let i = 0; i < 3; i++) b.add(P.cyl, 0xd12b2b, s * (0.8 + i * 0.1), 0.3, -0.3 + i * 0.3, 0, 0, s * 0.8, 0.07, 0.6, 0.07); }); M.crab = b.build(); }
  { const b = new Builder(); b.add(lathe([[0, 1.6], [0.6, 1.45], [0.85, 0.9], [0.9, 0.2], [0.75, 0.0], [0.55, 0.15], [0.35, 0.0], [0.0, 0.1]], 32), 0xf3f0ff); [-0.28, 0.28].forEach((x) => b.add(P.sphere, 0x1e1b4b, x, 1.1, 0.72, 0, 0, 0, 0.12, 0.18, 0.08)); b.add(P.sphere, 0x1e1b4b, 0, 0.75, 0.78, 0, 0, 0, 0.18, 0.22, 0.08); M.ghost = b.build(); }
  M.ghostMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, transparent: true, opacity: 0.85, roughness: 0.3, emissive: 0x8070ff, emissiveIntensity: 0.25 });
  { const b = new Builder(); b.add(P.cyl, 0xff3b5c, 0, 1.0, 0, 0, 0, 0, 1.0, 2.0, 1.0); b.add(P.sphere, 0xffffff, 0, 2.1, 0, 0, 0, 0, 1.0, 0.5, 1.0); M.sweepBase = b.build(); }
  M.sweepArm = (() => { const g = new THREE.CapsuleGeometry(0.42, 1, 8, 20); g.rotateX(PI / 2); g.translate(0, 0, 0.5); return g; })();
  M.sweepArmMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 1, map: (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); for (let y = 0; y < 256; y += 32) { g.fillStyle = (y / 32) % 2 ? '#ff2e4d' : '#ffffff'; g.fillRect(0, y, 64, 32); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 4); return t; })() });
  { const b = new Builder(); b.add(lathe([[0, 0], [1.6, 0], [2.4, 0.15], [2.5, 0.3], [0, 0.3]], 40), 0x3a2d36); b.add(new THREE.CircleGeometry(1.7, 40), 0xff7a00, 0, 0.32, 0, -PI / 2, 0, 0, 1, 1, 1, 2.0); M.geyserBase = b.build(); }
  M.geyserCol = new THREE.CylinderGeometry(1.2, 1.8, 1, 24, 1, true); M.geyserCol.translate(0, 0.5, 0);
  M.geyserMat = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  { const b = new Builder(); b.add(lathe([[0, -0.3], [1.2, -0.3], [2.6, 0], [1.2, 0.35], [0, 0.4]], 48), 0xb8c4d6); b.add(P.sphere, 0x7cf7d4, 0, 0.45, 0, 0, 0, 0, 1.0, 0.7, 1.0, 0.6); for (let i = 0; i < 8; i++) b.add(P.sphere, [0xff4fd8, 0xffe14d, 0x3ff0ff][i % 3], Math.cos(i * 0.785) * 2.0, 0.0, Math.sin(i * 0.785) * 2.0, 0, 0, 0, 0.18, 0.18, 0.18, 2); M.ufo = b.build(); }
  M.beam = new THREE.ConeGeometry(2.4, 8, 32, 1, true); M.beam.translate(0, -4, 0);
  M.beamMat = new THREE.MeshBasicMaterial({ color: 0x7cf7d4, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  { const b = new Builder(); [-0.6, 0.6].forEach((x, i) => b.add(P.sphere, [0xff4fd8, 0x3ff0ff, 0xffe14d][i], x, 0, 0, 0, 0, 0, 0.5, 0.62, 0.5)); b.add(P.sphere, 0xffe14d, 0, 0.25, 0.1, 0, 0, 0, 0.5, 0.62, 0.5); M.balloons = b.build(); }
  return (MODELS = M);
}

export class RaceView {
  constructor(race, W, opts = {}) {
    this.race = race; this.W = W; this.me = opts.me != null ? opts.me : 0; this.scene = E.scene; const M = models();
    this.grp = new THREE.Group(); this.scene.add(this.grp);
    this.karts = race.karts.map((k) => { const K = makeKart(k.look); this.grp.add(K.root); return K; });
    this.fx = new FX(this.scene, E.quality === 'low');
    const wk = W && W.th ? { snow: 'snow', volcano: 'embers', space: 'stars', candy: 'petals', haunted: 'fireflies' }[race.T ? race.T.theme : (race.arenaDef && race.arenaDef.theme === 'space' ? 'space' : '')] : null; this.fx.setWeather(wk);
    // orbs + coins
    const nb = Math.max(1, race.boxes.length);
    this.orbs = new THREE.InstancedMesh(M.orbShell, M.orbMat, nb); this.orbCores = new THREE.InstancedMesh(M.orbCore, vcMaterial(true), nb); this.orbs.frustumCulled = this.orbCores.frustumCulled = false; this.orbCores.castShadow = true; this.grp.add(this.orbCores, this.orbs);
    this.coinMax = race.battle ? 200 : Math.max(1, race.coinsW.length);
    this.coins = new THREE.InstancedMesh(M.coin, M.coinMat, this.coinMax); this.coins.castShadow = true; this.coins.frustumCulled = false; this.grp.add(this.coins);
    this.ents = new Map();
    this.haz = race.hazards.map((h) => this.makeHazard(h));
    // camera state
    this.cam = { yaw: 0, x: 0, y: 0, z: 0, init: false, shake: 0, fov: E.baseFov, back: false };
    this.ghost = null; this.balloonM = [];
    if (race.battle && race.mode === 'battle') this.karts.forEach((K) => { const b = new THREE.Mesh(M.balloons, vcMaterial(true)); b.position.set(0, 2.9, -1.3); b.castShadow = true; K.root.add(b); this.balloonM.push(b); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); st.position.set(0, -0.8, 0); b.add(st); });
    this.tmp = new THREE.Vector3(); this.t = 0; this.dtAcc = 0;
  }
  makeHazard(h) {
    const M = models(); const g = new THREE.Group(); this.grp.add(g); let m;
    const mk = (geo, mat) => { const x = new THREE.Mesh(geo, mat || vcMaterial(true)); x.castShadow = true; x.receiveShadow = true; g.add(x); return x; };
    switch (h.type) {
      case 'car': mk(M.car); break;
      case 'boulder': g.userData.roll = mk(M.boulder, vcMaterial(false)); g.userData.roll.position.y = 2; break;
      case 'snowball': g.userData.roll = mk(M.snowball, vcMaterial(false)); g.userData.roll.position.y = 2; break;
      case 'ball': g.userData.roll = mk(M.ball); g.userData.roll.scale.setScalar(1.5); break;
      case 'crab': mk(M.crab); break;
      case 'ghost': mk(M.ghost, M.ghostMat); break;
      case 'sweeper': mk(M.sweepBase); g.userData.arm = mk(M.sweepArm, M.sweepArmMat); g.userData.arm.position.y = 1.4; break;
      case 'geyser': mk(M.geyserBase); g.userData.col = mk(M.geyserCol, M.geyserMat); g.userData.col.castShadow = false; break;
      case 'ufo': g.userData.ufo = mk(M.ufo); g.userData.ufo.position.y = 9; g.userData.beam = mk(M.beam, M.beamMat); g.userData.beam.position.y = 9; g.userData.beam.castShadow = false; break;
      case 'cones': for (let i = 0; i < 5; i++) { const c = mk(prop('cone'), vcMaterial(false)); c.position.set((i - 2) * 1.0, 0, (i % 2) * 0.8); } break;
      case 'cactus': mk(prop('cactus'), vcMaterial(false)).scale.setScalar(0.9); break;
      case 'snowman': mk(prop('snowman'), vcMaterial(false)).scale.setScalar(0.85); break;
      case 'gumdrop': { const x = mk(prop('gumdrop')); x.scale.setScalar(1.2); x.material = new THREE.MeshPhysicalMaterial({ vertexColors: true, color: [0xff4fd8, 0x7cff6b, 0x3ff0ff][h.id % 3], roughness: 0.2, clearcoat: 1 }); break; }
      default: mk(prop('rock'), vcMaterial(false));
    }
    return g;
  }
  entMesh(e) {
    const M = models(); let m = this.ents.get(e.id); if (m) return m;
    const geo = { slime: M.slime, puck: M.puck, seeker: M.seeker, boom: M.boom }[e.type]; m = new THREE.Mesh(geo || M.puck, vcMaterial(true)); m.castShadow = true; this.grp.add(m); this.ents.set(e.id, m); return m;
  }
  setGhost(frames, look) { if (!frames || !frames.length) return; const K = makeKart(look); K.root.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.42; o.material.depthWrite = false; o.castShadow = false; } }); this.grp.add(K.root); this.ghost = { K, frames }; }
  dispose() { this.grp.removeFromParent(); this.fx.dispose(); this.grp.traverse((o) => { if (o.geometry && o.geometry.dispose && o.isInstancedMesh) o.dispose(); }); }
  update(dt) {
    const r = this.race, t = (this.t += dt), M = models();
    // karts
    r.karts.forEach((k, i) => {
      const K = this.karts[i];
      animateKart(K, Object.assign(k, { hidden: k.hidden || (k.out && r.mode === 'battle' && ((t * 4) | 0) % 2 === 0) }), dt, t);
      if (this.balloonM[i]) { const b = this.balloonM[i]; b.visible = k.balloons > 0; b.scale.setScalar(0.42 + 0.06 * k.balloons); b.rotation.z = Math.sin(t * 2 + i) * 0.15; }
      // particles
      const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = -fz, rz = fx; const near = (k.x - E.camera.position.x) ** 2 + (k.z - E.camera.position.z) ** 2 < 6400;
      if (!near || k.hidden) return;
      if (k.driftDir && k.grounded && k.driftLvl > 0 || (k.driftDir && k.grounded && Math.random() < 0.3)) { const yw = k.yaw + k.driftVis; const bx = Math.sin(yw), bz = Math.cos(yw); [-1, 1].forEach((s) => this.fx.spark(k.x - bx * 0.9 - bz * s * 0.85, k.y + 0.2, k.z - bz * 0.9 + bx * s * 0.85, k.driftLvl, -bx, -bz)); }
      if (k.boost > 0) { const yw = k.yaw + k.driftVis; const bx = Math.sin(yw), bz = Math.cos(yw); [-0.35, 0.35].forEach((s) => this.fx.flame(k.x - bx * 1.9 - bz * s, k.y + 0.75 + (k.shrink > 0 ? -0.3 : 0), k.z - bz * 1.9 + bx * s, -bx * 6, -bz * 6, k.boostLvl)); }
      if (k.grounded && Math.abs(k.speed) > 8 && k.surfLast === 'off' && Math.random() < 0.6) { const c = this.dustCol(); this.fx.dust(k.x - fx * 1.2, k.y, k.z - fz * 1.2, c[0], c[1], c[2]); }
      if (k.nova > 0 && Math.random() < 0.7) this.fx.burst(k.x, k.y + 1, k.z, 1, [[1.5, 1.3, 0.4], [0.5, 1.2, 1.5], [1.5, 0.5, 1.2]], 3, 0.5, 0.5);
      if (k.spin > 0 && Math.random() < 0.4) this.fx.burst(k.x, k.y + 1.6, k.z, 1, [[1.5, 1.4, 0.4]], 2, 0.5, 0.45);
    });
    // ghost replay (time trial)
    if (this.ghost) { const f = this.ghost.frames, ft = r.time * 15, i = Math.min(f.length - 2, Math.floor(ft)); if (i >= 0 && r.state === 'run') { const a = f[i], b = f[i + 1], u = clamp(ft - i, 0, 1); animateKart(this.ghost.K, { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, z: a[2] + (b[2] - a[2]) * u, yaw: a[3] + wrapAng(b[3] - a[3]) * u, steer: a[4], speed: 30, grounded: true }, dt, t); this.ghost.K.root.visible = ft < f.length; } else if (r.state === 'count') { const a = f[0]; animateKart(this.ghost.K, { x: a[0], y: a[1], z: a[2], yaw: a[3], speed: 0 }, dt, t); } }
    // orbs
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
    r.boxes.forEach((b, i) => { const sc = b.t > 0 ? Math.max(0.001, 1 - b.t / 0.3) * (b.t < 0.3 ? 1 : 0.001) : 1; const k = b.t > 0 && b.t < 0.4 ? 1 - b.t / 0.4 : (b.t > 0 ? 0.001 : 1); const y = b.y + Math.sin(t * 2 + i) * 0.25;
      e.set(t * 0.7 + i, t + i, 0); q.setFromEuler(e); m4.compose(v.set(b.x, y, b.z), q, s.setScalar(1.05 * k)); this.orbs.setMatrixAt(i, m4);
      e.set(0, t * 2.5 + i, 0); q.setFromEuler(e); m4.compose(v.set(b.x, y, b.z), q, s.setScalar(0.85 * k)); this.orbCores.setMatrixAt(i, m4); });
    this.orbs.count = this.orbCores.count = r.boxes.length; this.orbs.instanceMatrix.needsUpdate = this.orbCores.instanceMatrix.needsUpdate = true;
    let n = 0; for (const c of r.coinsW) { if (c.t > 0 || n >= this.coinMax) continue; e.set(0, t * 3 + c.x, 0); q.setFromEuler(e); m4.compose(v.set(c.x, c.y + Math.sin(t * 3 + c.z) * 0.15, c.z), q, s.setScalar(1)); this.coins.setMatrixAt(n++, m4); }
    this.coins.count = n; this.coins.instanceMatrix.needsUpdate = true;
    // entities
    const alive = new Set();
    for (const en of r.ents) { alive.add(en.id); const m = this.entMesh(en); m.position.set(en.x, en.y - (en.type === 'slime' ? 0 : 0.2), en.z); if (en.type === 'puck' || en.type === 'seeker') m.rotation.y += dt * 12; if (en.type === 'boom') { m.rotation.y = t * 2; const sc = en.landed ? 1 + Math.sin(t * 30) * 0.08 * (2 - en.fuse) : 1; m.scale.setScalar(sc); } if (en.type === 'slime') m.scale.set(1 + Math.sin(t * 4) * 0.05, 1 - Math.sin(t * 4) * 0.05, 1); }
    for (const [id, m] of this.ents) if (!alive.has(id)) { m.removeFromParent(); this.ents.delete(id); }
    // hazards
    r.hazards.forEach((h, i) => { if (r.guest) hazardPos(r, h, r.time); const g = this.haz[i]; g.position.set(h.x, h.y, h.z); g.rotation.y = h.yaw || 0;
      if (g.userData.roll) { g.userData.roll.rotation.x = -(h.roll || 0); }
      if (h.type === 'crab') g.rotation.y = (h.yaw || 0) + PI / 2 + Math.sin(t * 8) * 0.1;
      if (h.type === 'ghost') g.rotation.y = Math.atan2(E.camera.position.x - h.x, E.camera.position.z - h.z);
      if (g.userData.arm) { g.userData.arm.rotation.y = h.ang; g.userData.arm.scale.set(1, 1, h.armLen || 7); g.rotation.y = 0; }
      if (g.userData.col) { const k = h.erupt || 0; g.userData.col.visible = k > 0.02 || h.warn; g.userData.col.scale.set(1 + k * 0.3, h.warn ? 0.6 + Math.sin(t * 20) * 0.2 : 0.5 + k * 13, 1 + k * 0.3); if (k > 0.3 && Math.random() < 0.5) this.fx.burst(h.x, h.y + k * 12, h.z, 2, [[1.5, 0.6, 0.1], [1.5, 1.1, 0.3]], 6, 0.8, 0.8); }
      if (g.userData.ufo) { g.userData.ufo.rotation.y = t * 2; g.userData.ufo.position.y = 9 + Math.sin(t * 2) * 0.4; g.userData.beam.visible = h.on; g.userData.beam.scale.set(1, 1, 1); g.userData.beam.material.opacity = 0.2 + Math.sin(t * 10) * 0.06; } });
    if (this.W && this.W.anim) this.W.anim.forEach((f) => f(dt, t));
    this.updateCamera(dt);
    this.fx.setScale(E.h * E.pixelRatio);
    this.fx.update(dt, E.camera);
  }
  dustCol() { const th = this.race.T ? this.race.T.theme : 'city'; return { city: [0.55, 0.85, 0.45], desert: [0.95, 0.75, 0.5], candy: [1, 0.85, 0.95], beach: [1, 0.9, 0.7], haunted: [0.5, 0.75, 0.6], snow: [1, 1, 1], volcano: [0.45, 0.4, 0.45], space: [0.6, 0.5, 1] }[th] || [0.8, 0.8, 0.8]; }
  updateCamera(dt) {
    const r = this.race, k = r.karts[this.me]; if (!k) return; const c = this.cam, cam = E.camera;
    const portrait = E.h > E.w;
    const dist = (portrait ? 8.6 : 7.0) * (k.shrink > 0 ? 0.85 : 1), hgt = portrait ? 3.7 : 3.0;
    let tyaw = k.yaw + (k.driftVis || 0) * 0.45; if (k.spin > 0) tyaw = c.yaw; if (c.back) tyaw += PI;
    if (!c.init || k.respawn > 1.2) { c.yaw = tyaw; c.init = true; c.x = k.x - Math.sin(tyaw) * dist; c.z = k.z - Math.cos(tyaw) * dist; c.y = k.y + hgt; }
    c.yaw += wrapAng(tyaw - c.yaw) * (1 - Math.exp(-(k.driftDir ? 4 : 6) * dt));
    const tx = k.x - Math.sin(c.yaw) * dist, tz = k.z - Math.cos(c.yaw) * dist; const ty = k.y + hgt + (k.glide ? 1.2 : 0) + (r.battle ? 0.6 : 0);
    c.x = damp(c.x, tx, 14, dt); c.z = damp(c.z, tz, 14, dt); c.y = damp(c.y, Math.max(ty, (k.groundY || k.y) + 1.8), k.grounded ? 8 : 4, dt);
    c.shake = Math.max(0, c.shake - dt * 2.5); const sh = c.shake * c.shake * 0.6;
    cam.position.set(c.x + (Math.random() - 0.5) * sh, c.y + (Math.random() - 0.5) * sh, c.z + (Math.random() - 0.5) * sh);
    const la = 4.5; this.tmp.set(k.x + Math.sin(c.yaw) * la, k.y + 1.3, k.z + Math.cos(c.yaw) * la); cam.lookAt(this.tmp);
    const tf = E.baseFov + (k.boost > 0 ? 9 : 0) + clamp((Math.abs(k.speed) - 25) * 0.25, 0, 5);
    c.fov = damp(c.fov, tf, 4, dt); if (Math.abs(cam.fov - c.fov) > 0.05) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    followShadow(k.x + Math.sin(c.yaw) * 14, k.y, k.z + Math.cos(c.yaw) * 14);
  }
  onFx(type, x, y, z) {
    if (type === 'orb') this.fx.burst(x, y, z, 26, [[1.2, 0.5, 1.4], [0.4, 1.2, 1.5], [1.5, 1.3, 0.4]], 7, 0.6, 0.7);
    else if (type === 'coin') this.fx.burst(x, y, z, 10, [[1.6, 1.25, 0.3]], 4, 0.4, 0.45);
    else if (type === 'boom') this.fx.explosion(x, y, z);
    else if (type === 'poof') this.fx.burst(x, y, z, 18, [[1.4, 1.4, 1.4], [0.5, 1.2, 1.5]], 6, 0.5, 0.6);
  }
  onEvent(k, ev) {
    const me = this.race.karts[this.me];
    if (!k) return;
    if (ev === 'land' && Math.abs(k.y - E.camera.position.y) < 40) this.fx.smoke(k.x, k.y, k.z, 6, this.dustCol());
    if ((ev === 'spin' || ev === 'tumble') && k === me) this.cam.shake = ev === 'tumble' ? 1.2 : 0.6;
    if (ev === 'finish' && k === me) this.fx.confetti(k.x, k.y, k.z, 120);
    if (ev === 'shieldpop') this.fx.burst(k.x, k.y + 1, k.z, 30, [[0.6, 1.2, 1.5], [1.4, 1.4, 1.5]], 8, 0.5, 0.6);
    if (ev === 'balloon') this.fx.burst(k.x, k.y + 2.6, k.z, 30, [[1.5, 0.4, 1.0], [0.4, 1.3, 1.5], [1.5, 1.3, 0.3]], 7, 0.6, 0.6);
    if (ev === 'miniturbo' || ev === 'rocketstart' || ev === 'trickboost') this.fx.burst(k.x, k.y + 0.6, k.z, 14, [[1.5, 1.2, 0.4], [0.5, 1, 1.5]], 5, 0.4, 0.5);
    if (ev === 'trick') this.fx.burst(k.x, k.y + 1, k.z, 16, [[1.5, 1.4, 0.4], [1.5, 0.6, 1.4]], 6, 0.5, 0.55);
  }
}
