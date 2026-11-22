// cameras.js — wall-mounted security cameras with sweeping cones.
// A camera sits still and sweeps its cone back and forth around a base angle.
// It cannot be bribed or outrun, only read: time the sweep, slip through the
// gap, or hide behind a wall or a smoke cloud. Spotted by a camera, the alarm
// climbs faster than from a guard — cameras never blink.
import { CAMERA } from './config.js';
import { dist, angleTo, angleDiff, losClear } from './geometry.js';

export function makeCamera(def, index) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    range: def.range || CAMERA.visionRange,
    // Stagger the sweep phase so cameras on one floor never move in lockstep.
    phase: index * 1.7,
    time: 0,
    angle: def.baseAngle,
    seen: 0,
  };
}

export function updateCamera(camera, dt) {
  camera.time += dt;
  camera.angle = camera.baseAngle
    + Math.sin(camera.time * CAMERA.sweepSpeed + camera.phase) * CAMERA.sweepArc;
}

// True (0..1 strength) when `point` is inside the sweeping cone with a clear view.
export function cameraSees(camera, point, walls) {
  const d = dist(camera.x, camera.y, point.x, point.y);
  if (d > camera.range) return 0;
  const diff = Math.abs(angleDiff(angleTo(camera.x, camera.y, point.x, point.y), camera.angle));
  if (diff > CAMERA.visionHalfAngle) return 0;
  if (!losClear(camera.x, camera.y, point.x, point.y, walls)) return 0;
  return 1 - (d / camera.range) * 0.5;
}
