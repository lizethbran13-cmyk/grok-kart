// Menu backdrop: glossy turntable stage with the player's kart, confetti balloons, bright sky.
import * as THREE from 'three';
import { E, setEnvironment, followShadow } from './engine.js';
import { makeKart, animateKart } from './models.js';
import { Builder, P, blob } from './geo.js';
import { vcMaterial } from './themes.js';
import { prop } from './props.js';

const PI = Math.PI;
export class Showroom {
  constructor() {
    setEnvironment({ skyTop: 0x5b6cff, skyMid: 0xff8fd8, skyBot: 0xffe6a8, fog: 0xffc6e8, fogD: 0.006, sunDir: [0.4, 0.8, 0.5], sunColor: 0xfff4e0, sunI: 2.4, hemiSky: 0xffeefa, hemiGround: 0xa070ff, hemiI: 1.1, exposure: 1.05, sunDisc: 0.7, envI: 1.0 });
    this.grp = new THREE.Group(); E.scene.add(this.grp);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.6, 64), new THREE.MeshPhysicalMaterial({ color: 0x2a1a7a, roughness: 0.2, clearcoat: 1, metalness: 0.1 })); plat.position.y = -0.3; plat.receiveShadow = true; this.grp.add(plat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.35, 0.12, 16, 96), new THREE.MeshStandardMaterial({ color: 0x3ff0ff, emissive: 0x3ff0ff, emissiveIntensity: 2 })); ring.rotation.x = PI / 2; this.grp.add(ring);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: 0xffb3e6, roughness: 0.5 })); floor.rotation.x = -PI / 2; floor.position.y = -0.6; floor.receiveShadow = true; this.grp.add(floor);
    // checker ring
    const ck = new Builder(); for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2; ck.add(P.rboxS, i % 2 ? 0xffffff : 0x1f2433, Math.cos(a) * 6.5, -0.55, Math.sin(a) * 6.5, 0, -a, 0, 0.9, 0.1, 1.6); }
    const balloons = new Builder(); const cols = [0xff4fd8, 0x3ff0ff, 0xffe14d, 0x7cff6b, 0xff7a3d, 0xb26bff];
    for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2 + (i % 3) * 0.2, r = 10 + (i % 5) * 3; balloons.add(P.sphere, cols[i % 6], Math.cos(a) * r, 3 + (i % 4) * 2.2, Math.sin(a) * r, 0, 0, 0, 0.9, 1.1, 0.9); }
    const m1 = new THREE.Mesh(ck.build(), vcMaterial(true)); m1.receiveShadow = true; this.grp.add(m1);
    this.bal = new THREE.Mesh(balloons.build(), vcMaterial(true)); this.grp.add(this.bal);
    const trees = new THREE.InstancedMesh(prop('lollipop'), vcMaterial(true), 14); const mt = new THREE.Matrix4();
    for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; mt.compose(new THREE.Vector3(Math.cos(a) * 24, -0.6, Math.sin(a) * 24), new THREE.Quaternion(), new THREE.Vector3(1.6, 1.6, 1.6)); trees.setMatrixAt(i, mt); } trees.castShadow = true; this.grp.add(trees);
    this.kart = null; this.t = 0; this.look = null; this.angle = 0.6; this.drag = 0;
  }
  setLook(look) { const key = JSON.stringify(look); if (key === this.lookKey) return; this.lookKey = key; if (this.kart) this.kart.root.removeFromParent(); this.kart = makeKart(look); this.grp.add(this.kart.root); this.bounce = 0.4; }
  update(dt) {
    this.t += dt; const t = this.t;
    this.angle += dt * 0.5 + this.drag; this.drag *= 0.9;
    if (this.kart) { this.bounce = Math.max(0, (this.bounce || 0) - dt); animateKart(this.kart, { x: 0, y: Math.sin(this.bounce * 12) * this.bounce * 0.5, z: 0, yaw: this.angle, speed: 4, steer: Math.sin(t * 0.8) * 0.4 }, dt, t); }
    this.bal.rotation.y = t * 0.05; this.bal.position.y = Math.sin(t) * 0.3;
    const portrait = E.h > E.w; const cam = E.camera;
    cam.position.set(0, portrait ? 3.4 : 2.6, portrait ? 9.5 : 7.2); cam.lookAt(0, portrait ? -0.3 : 0.6, 0);
    if (portrait) { cam.setViewOffset(E.w, E.h, 0, E.h * 0.17, E.w, E.h); } else cam.clearViewOffset();
    if (cam.fov !== E.baseFov) { cam.fov = E.baseFov; cam.updateProjectionMatrix(); }
    followShadow(0, 0, 0);
  }
  dispose() { this.grp.removeFromParent(); E.camera.clearViewOffset(); }
}
