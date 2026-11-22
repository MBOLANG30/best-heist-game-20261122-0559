// geometry.js — small pure math: distances, angles, line of sight, collisions.
// No game state lives here, so guards, cameras, the world and the renderer can
// all share it without import cycles.
export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Shortest signed difference between two angles, in (-PI, PI].
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// True when the segment (x1,y1)-(x2,y2) touches rectangle r (including edges).
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = cross(x3, y3, x4, y4, x1, y1);
  const d2 = cross(x3, y3, x4, y4, x2, y2);
  const d3 = cross(x1, y1, x2, y2, x3, y3);
  const d4 = cross(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(ax, ay, bx, by, px, py) {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

// True when nothing blocks the view between the two points.
export function losClear(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

// Push a circle (x, y, radius) out of every rectangle it overlaps. Returns true
// when a push happened. Mutates the passed point object.
export function resolveCircleWalls(p, radius, walls) {
  let pushed = false;
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(p.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(p.y, w.y + w.h));
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= radius * radius) continue;
    pushed = true;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      p.x = cx + (dx / d) * radius;
      p.y = cy + (dy / d) * radius;
    } else {
      // Centre inside the rectangle: push out along the shallowest side.
      const left = p.x - w.x;
      const right = w.x + w.w - p.x;
      const top = p.y - w.y;
      const bottom = w.y + w.h - p.y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) p.x = w.x - radius;
      else if (m === right) p.x = w.x + w.w + radius;
      else if (m === top) p.y = w.y - radius;
      else p.y = w.y + w.h + radius;
    }
  }
  return pushed;
}

// Deterministic PRNG (mulberry32) for the few places the game needs randomness.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
