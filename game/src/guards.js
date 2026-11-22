// guards.js — the night shift: patrol, suspicion and investigation.
// A guard walks its route, pauses at each waypoint, and watches a cone. When a
// thrown coin lands nearby it walks over to look (and the thief slips past).
// Guards never chase and never teleport: being seen fills the alarm meter, and
// a full meter is what gets the thief caught. That keeps the caught moment fair:
// the player always sees the meter climbing and can break line of sight.
import { GUARD } from './config.js';
import { dist, angleTo, angleDiff, losClear } from './geometry.js';

export function makeGuard(def) {
  return {
    path: def.path,
    speedMul: def.speed || 1,
    pause: def.pause || 1,
    x: def.path[0][0],
    y: def.path[0][1],
    targetIndex: 1,
    wait: 0,
    angle: 0,
    mode: 'patrol', // patrol | investigate
    investigate: null, // {x, y}
    seen: 0, // 0..1 how strongly this guard currently sees the thief
  };
}

// True when `point` lies inside the guard's cone and no wall blocks the view.
export function guardSees(guard, point, walls) {
  const d = dist(guard.x, guard.y, point.x, point.y);
  if (d > GUARD.visionRange) return 0;
  const diff = Math.abs(angleDiff(angleTo(guard.x, guard.y, point.x, point.y), guard.angle));
  if (diff > GUARD.visionHalfAngle) return 0;
  if (!losClear(guard.x, guard.y, point.x, point.y, walls)) return 0;
  // Closer reads are stronger: 1.0 at point blank, ~0.35 at the cone's edge.
  return 1 - (d / GUARD.visionRange) * 0.65;
}

export function updateGuard(guard, dt, player, walls, inSmoke) {
  if (guard.mode === 'investigate' && guard.investigate) {
    const target = guard.investigate;
    const d = dist(guard.x, guard.y, target.x, target.y);
    const step = GUARD.investigateSpeed * dt;
    if (d <= step + 4) {
      guard.x = target.x;
      guard.y = target.y;
      guard.wait += dt;
      guard.angle += dt * 1.5; // looks around while puzzled
      if (guard.wait >= GUARD.investigatePause) {
        guard.mode = 'patrol';
        guard.investigate = null;
        guard.wait = 0;
      }
    } else {
      guard.angle = angleTo(guard.x, guard.y, target.x, target.y);
      guard.x += Math.cos(guard.angle) * step;
      guard.y += Math.sin(guard.angle) * step;
    }
    return;
  }
  // Patrol: walk to the next waypoint, pause, turn to the next leg.
  if (guard.wait > 0) {
    guard.wait -= dt;
    if (guard.wait <= 0) {
      guard.targetIndex = (guard.targetIndex + 1) % guard.path.length;
    }
    return;
  }
  const target = guard.path[guard.targetIndex];
  const d = dist(guard.x, guard.y, target[0], target[1]);
  const step = GUARD.patrolSpeed * guard.speedMul * dt;
  if (d <= step) {
    guard.x = target[0];
    guard.y = target[1];
    guard.wait = guard.pause;
    return;
  }
  guard.angle = angleTo(guard.x, guard.y, target[0], target[1]);
  guard.x += Math.cos(guard.angle) * step;
  guard.y += Math.sin(guard.angle) * step;
}

// Send every guard within earshot of the coin to investigate the landing spot.
export function distractGuards(guards, x, y, radius) {
  let heard = 0;
  for (const guard of guards) {
    if (dist(guard.x, guard.y, x, y) <= radius) {
      guard.mode = 'investigate';
      guard.investigate = { x, y };
      guard.wait = 0;
      heard += 1;
    }
  }
  return heard;
}
