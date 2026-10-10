// Input: keyboard + touch (buttons / drag wheel / tilt) with auto-accelerate.
import { $ } from './util.js';

export const IN = { steer: 0, gas: false, brake: false, drift: false, item: false, keys: {}, touch: { L: false, R: false, drift: false, item: false, gas: false, brake: false, dragX: 0, dragging: false }, tilt: 0, tiltOn: false, mode: 'buttons', auto: true, active: false };

export function initInput(opts) {
  IN.mode = opts.steer || 'buttons'; IN.auto = opts.auto !== false;
  window.addEventListener('keydown', (e) => { if (e.target && e.target.tagName === 'INPUT') return; IN.keys[e.code] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); if (IN.onKey) IN.onKey(e.code); });
  window.addEventListener('keyup', (e) => { IN.keys[e.code] = false; });
  window.addEventListener('blur', () => { IN.keys = {}; });
  const T = IN.touch;
  const bind = (id, key) => { const el = $(id); if (!el) return; const on = (e) => { e.preventDefault(); T[key] = true; el.classList.add('on'); if (navigator.vibrate && key !== 'gas') try { navigator.vibrate(8); } catch (x) {} }; const off = (e) => { e.preventDefault(); T[key] = false; el.classList.remove('on'); };
    el.addEventListener('touchstart', on, { passive: false }); el.addEventListener('touchend', off, { passive: false }); el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on); el.addEventListener('mouseup', off); el.addEventListener('mouseleave', off); };
  bind('tL', 'L'); bind('tR', 'R'); bind('tDrift', 'drift'); bind('tItem', 'item'); bind('tGas', 'gas'); bind('tBrake', 'brake');
  // drag wheel: touch anywhere on the left half and slide sideways
  const z = $('tDragZone'), knob = $('tDragKnob'); let id = null, x0 = 0;
  if (z) {
    z.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; id = t.identifier; x0 = t.clientX; T.dragging = true; T.dragX = 0; knob.style.left = (t.clientX - z.getBoundingClientRect().left) + 'px'; knob.style.top = (t.clientY - z.getBoundingClientRect().top) + 'px'; knob.classList.add('on'); }, { passive: false });
    z.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === id) { T.dragX = Math.max(-1, Math.min(1, (t.clientX - x0) / 55)); knob.style.transform = `translate(${T.dragX * 40}px,0)`; } }, { passive: false });
    const end = (e) => { for (const t of e.changedTouches) if (t.identifier === id) { id = null; T.dragging = false; T.dragX = 0; knob.style.transform = ''; knob.classList.remove('on'); } };
    z.addEventListener('touchend', end); z.addEventListener('touchcancel', end);
  }
  window.addEventListener('deviceorientation', (e) => { if (!IN.tiltOn) return; const land = Math.abs(window.orientation || 0) === 90 || (screen.orientation && /landscape/.test(screen.orientation.type));
    let v = land ? (e.beta || 0) * (((window.orientation || (screen.orientation && screen.orientation.angle)) === -90 || (screen.orientation && screen.orientation.angle === 270)) ? -1 : 1) : (e.gamma || 0); IN.tilt = Math.max(-1, Math.min(1, v / 25)); });
}
export async function enableTilt() {
  try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') { const r = await DeviceOrientationEvent.requestPermission(); IN.tiltOn = r === 'granted'; } else IN.tiltOn = true; } catch (e) { IN.tiltOn = false; }
  return IN.tiltOn;
}
export function setControlMode(mode, auto) {
  IN.mode = mode; IN.auto = auto;
  document.body.classList.toggle('steer-buttons', mode === 'buttons'); document.body.classList.toggle('steer-drag', mode === 'drag'); document.body.classList.toggle('steer-tilt', mode === 'tilt'); document.body.classList.toggle('auto-gas', !!auto);
}
// sample current controls -> plain object
export function readInput(counting) {
  const K = IN.keys, T = IN.touch;
  let steer = 0;
  if (K.ArrowLeft || K.KeyA) steer -= 1; if (K.ArrowRight || K.KeyD) steer += 1;
  if (IN.mode === 'buttons') { if (T.L) steer -= 1; if (T.R) steer += 1; }
  else if (IN.mode === 'drag') { if (T.dragging) steer += T.dragX; if (T.L) steer -= 1; if (T.R) steer += 1; }
  else if (IN.mode === 'tilt') { const tv = Math.abs(IN.tilt) < 0.08 ? 0 : IN.tilt; steer += tv * 1.25; }
  steer = Math.max(-1, Math.min(1, steer));
  const keyGas = !!(K.ArrowUp || K.KeyW), brake = !!(K.ArrowDown || K.KeyS || T.brake);
  const drift = !!(K.Space || K.ShiftLeft || K.ShiftRight || K.KeyC || T.drift);
  const item = !!(K.KeyX || K.KeyE || K.KeyZ || K.Enter || T.item);
  let gas = keyGas || T.gas || (IN.auto && !counting && !brake);
  if (counting) gas = keyGas || T.gas || T.drift || !!K.Space;
  return { steer, gas, brake, drift, item };
}
