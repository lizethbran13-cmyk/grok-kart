// Grok Kart Party - "Turbo" render core: PBR + soft shadows + GTAO + bloom + filmic tone mapping.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

export const E = {
  quality: 'high', autoQ: true, fpsLog: [], lowSince: 0, frameCb: null, t: 0,
};

export function initEngine(canvas, quality) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping; // keeps cartoon colours saturated
  r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  E.renderer = r;
  E.scene = new THREE.Scene();
  E.camera = new THREE.PerspectiveCamera(62, 1, 0.3, 1600);
  E.pmrem = new THREE.PMREMGenerator(r);
  // lights
  E.sun = new THREE.DirectionalLight(0xffffff, 2.6);
  E.sun.castShadow = true;
  E.sun.shadow.mapSize.set(2048, 2048);
  const sc = E.sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 260;
  E.sun.shadow.bias = -0.0004; E.sun.shadow.normalBias = 0.04; E.sun.shadow.radius = 4;
  E.sunDir = new THREE.Vector3(0.45, 0.8, 0.3).normalize();
  E.hemi = new THREE.HemisphereLight(0xcfe8ff, 0x6b5a40, 0.5);
  E.scene.add(E.sun, E.sun.target, E.hemi);
  setQuality(quality || 'high', true);
  window.addEventListener('resize', resize);
  resize();
  return E;
}

function buildComposer() {
  const r = E.renderer;
  if (E.composer) { E.composer.dispose(); E.composer = null; }
  if (E.quality !== 'high') return;
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
  const c = new EffectComposer(r, rt);
  c.addPass(new RenderPass(E.scene, E.camera));
  E.gtao = new GTAOPass(E.scene, E.camera, 1, 1);
  E.gtao.output = GTAOPass.OUTPUT.Default;
  E.gtao.blendIntensity = 0.85;
  E.gtao.updateGtaoMaterial({ radius: 1.2, distanceExponent: 1.6, thickness: 2.0, scale: 1.0, samples: 12, distanceFallOff: 1.0 });
  E.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 8 });
  c.addPass(E.gtao);
  E.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.45, 1.1);
  c.addPass(E.bloom);
  c.addPass(new OutputPass());
  E.composer = c;
}

export function setQuality(q, init) {
  E.quality = q === 'low' ? 'low' : 'high';
  const r = E.renderer;
  const dpr = window.devicePixelRatio || 1;
  E.pixelRatio = E.quality === 'high' ? Math.min(dpr, 2) : Math.min(dpr, 1.25) * 0.85;
  r.setPixelRatio(E.pixelRatio);
  r.shadowMap.enabled = true;
  r.shadowMap.type = E.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  E.sun.shadow.mapSize.set(E.quality === 'high' ? 2048 : 1024, E.quality === 'high' ? 2048 : 1024);
  if (E.sun.shadow.map) { E.sun.shadow.map.dispose(); E.sun.shadow.map = null; }
  E.scene.traverse((o) => { if (o.material && o.material.needsUpdate !== undefined) { const m = Array.isArray(o.material) ? o.material : [o.material]; m.forEach((mm) => mm.needsUpdate = true); } });
  buildComposer();
  if (!init) resize();
  E.fpsLog = []; E.lowSince = 0;
  if (E.onQuality) E.onQuality(E.quality);
}

export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  E.w = w; E.h = h;
  E.renderer.setSize(w, h, false);
  E.camera.aspect = w / h;
  E.baseFov = w < h ? 72 : 60;
  E.camera.updateProjectionMatrix();
  if (E.composer) {
    E.composer.setPixelRatio(E.pixelRatio);
    E.composer.setSize(w, h);
    // AO + bloom at reduced res keeps phones fast
    if (E.gtao) E.gtao.setSize(Math.ceil(w * E.pixelRatio * 0.5), Math.ceil(h * E.pixelRatio * 0.5));
    if (E.bloom) E.bloom.setSize(Math.ceil(w * E.pixelRatio * 0.5), Math.ceil(h * E.pixelRatio * 0.5));
  }
}

// ---------- environment / sky ----------
let skyObj = null, skyDome = null, envRT = null;
export function setEnvironment(env) {
  const s = E.scene;
  if (skyObj) { s.remove(skyObj); skyObj.geometry.dispose(); skyObj.material.dispose(); skyObj = null; }
  if (skyDome) { s.remove(skyDome); skyDome.geometry.dispose(); skyDome.material.dispose(); skyDome = null; }
  if (envRT) { envRT.dispose(); envRT = null; }
  E.sunDir.set(env.sunDir[0], env.sunDir[1], env.sunDir[2]).normalize();
  E.sun.color.set(env.sunColor || 0xffffff); E.sun.intensity = env.sunI != null ? env.sunI : 2.6;
  E.hemi.color.set(env.hemiSky || 0xcfe8ff); E.hemi.groundColor.set(env.hemiGround || 0x5a4a38); E.hemi.intensity = env.hemiI != null ? env.hemiI : 0.5;
  E.renderer.toneMappingExposure = env.exposure || 1.0;
  if (E.bloom) { E.bloom.threshold = env.bloomT || 1.1; E.bloom.strength = env.bloomS || 0.5; }
  const envScene = new THREE.Scene();
  {
    // stylised gradient dome with stars/nebula for night & space themes
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(env.skyTop) }, mid: { value: new THREE.Color(env.skyMid) }, bot: { value: new THREE.Color(env.skyBot) }, stars: { value: env.stars || 0 }, neb: { value: new THREE.Color(env.nebula || 0x000000) }, moonDir: { value: E.sunDir.clone() }, moon: { value: env.moon || 0 }, sun: { value: env.sunDisc || 0 }, sunCol: { value: new THREE.Color(env.sunColor || 0xfff4c0) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 top, mid, bot, neb, moonDir; uniform float stars, moon, sun; uniform vec3 sunCol; varying vec3 vP;
        float h(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
        float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f); return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
        void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(mid, top, pow(clamp(y,0.,1.),0.6)) : mix(mid, bot, clamp(-y*3.0,0.,1.));
          if (stars > 0.0) { vec3 q = vP*220.0; float s = h(floor(q)); float tw = step(0.9965, s) * smoothstep(0.5, 0.0, length(fract(q)-0.5)); c += vec3(tw)*stars*smoothstep(-0.05,0.2,y);
            float nb = n3(vP*3.0)*0.6 + n3(vP*7.0)*0.4; c += neb * pow(nb, 3.0) * 1.6 * smoothstep(-0.1, 0.4, y); }
          if (moon > 0.0) { float d = dot(normalize(vP), normalize(moonDir)); c += vec3(1.0,0.97,0.85)*smoothstep(0.9985,0.999,d)*moon*2.0 + vec3(0.6,0.7,1.0)*pow(max(d,0.),60.)*0.25*moon; }
          float sd = dot(normalize(vP), normalize(moonDir)); c += sunCol * (smoothstep(0.9975,0.999,sd)*sun*1.5 + pow(max(sd,0.),24.)*0.35*sun);
          gl_FragColor = vec4(c,1.0); }`
    });
    skyDome = new THREE.Mesh(new THREE.SphereGeometry(1300, 48, 24), mat); skyDome.frustumCulled = false; skyDome.renderOrder = -10;
    s.add(skyDome);
    const d2 = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), mat); envScene.add(d2);
    s.background = null;
  }
  // a few soft "area lights" into the env so PBR paint gets nice highlights
  const lm = new THREE.MeshBasicMaterial({ color: new THREE.Color(env.envLight || 0xffffff).multiplyScalar(env.envLightI || 2.5), side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), lm); panel.position.set(0, 40, 0); panel.rotation.x = Math.PI / 2; envScene.add(panel);
  const p2 = panel.clone(); p2.position.set(30, 15, -20); p2.lookAt(0, 0, 0); envScene.add(p2);
  const gm = new THREE.Mesh(new THREE.SphereGeometry(48, 16, 8, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), new THREE.MeshBasicMaterial({ color: env.hemiGround || 0x554433, side: THREE.BackSide })); envScene.add(gm);
  envRT = E.pmrem.fromScene(envScene, 0.02);
  s.environment = envRT.texture;
  s.environmentIntensity = env.envI != null ? env.envI : 0.9;
  s.fog = new THREE.FogExp2(env.fog, env.fogD || 0.0025);
  envScene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}

// shadows follow the player
export function followShadow(x, y, z) {
  const d = E.sunDir;
  E.sun.position.set(x + d.x * 120, y + d.y * 120, z + d.z * 120);
  E.sun.target.position.set(x, y, z);
  E.sun.target.updateMatrixWorld();
}

export function render(dt) {
  E.t += dt;
  if (E.composer) E.composer.render(dt); else E.renderer.render(E.scene, E.camera);
}

// auto step-down: FPS < 30 for 5 seconds on HIGH -> LOW
export function trackFps(dt, now) {
  if (!E.autoQ || E.quality !== 'high' || document.hidden) { E.lowSince = 0; return; }
  E.fpsLog.push(dt); if (E.fpsLog.length > 30) E.fpsLog.shift();
  if (E.fpsLog.length < 30) return;
  const avg = E.fpsLog.reduce((a, b) => a + b, 0) / E.fpsLog.length;
  const fps = 1 / avg;
  if (fps < 30) { if (!E.lowSince) E.lowSince = now; else if (now - E.lowSince > 5000) { setQuality('low'); if (E.onAutoLow) E.onAutoLow(); } }
  else E.lowSince = 0;
}
