// levels.js — the three floors of the Gilded Vault, as pure data.
// Each level is a set of wall/crate rectangles (they block movement AND sight),
// guard patrol routes, sweeping cameras, loot pieces, an exit door and a start.
// Nothing here moves; world.js turns this data into a live state.
// Layout rule: blocks are scattered obstacles, never sealed rooms, so there are
// always several routes through every floor and the thief can never get stuck.
import { LEVEL_NAMES } from './config.js';

function wall(x, y, w, h) { return { x, y, w, h, kind: 'wall' }; }
function crate(x, y, w, h) { return { x, y, w, h, kind: 'crate' }; }
function gold(x, y) { return { x, y, kind: 'gold' }; }
function gem(x, y) { return { x, y, kind: 'gem' }; }
function vault(x, y) { return { x, y, kind: 'vault' }; }

const BORDER = [
  wall(0, 64, 1280, 18), // top, just under the HUD bar
  wall(0, 702, 1280, 18), // bottom
  wall(0, 64, 18, 638), // left
  wall(1262, 64, 18, 638), // right
];

export const LEVELS = [
  {
    name: LEVEL_NAMES[0],
    subtitle: 'Slip past the night shift. Grab every piece, then reach the green door.',
    player: { x: 90, y: 620 },
    exit: { x: 1206, y: 315, w: 56, h: 90 },
    walls: [
      ...BORDER,
      wall(300, 180, 180, 24),
      wall(800, 180, 180, 24),
      wall(300, 480, 180, 24),
      wall(800, 480, 180, 24),
      crate(580, 300, 64, 64),
      crate(640, 300, 64, 64),
      crate(580, 364, 64, 64),
      crate(640, 364, 64, 64),
      crate(180, 330, 56, 56),
      crate(1044, 330, 56, 56),
    ],
    guards: [
      { path: [[240, 130], [1040, 130]], speed: 1, pause: 1.2 },
      { path: [[1040, 590], [240, 590]], speed: 1, pause: 1.2 },
    ],
    cameras: [
      { x: 640, y: 90, baseAngle: Math.PI / 2, range: 250 },
    ],
    loot: [gold(640, 265), gold(640, 455), gem(150, 150), gem(1130, 580), gold(1130, 150)],
  },
  {
    name: LEVEL_NAMES[1],
    subtitle: 'The gallery is watched from above. The vault needs a steady hand — hold E beside it.',
    player: { x: 90, y: 620 },
    exit: { x: 1206, y: 315, w: 56, h: 90 },
    walls: [
      ...BORDER,
      wall(200, 220, 300, 24),
      wall(780, 220, 300, 24),
      wall(200, 470, 300, 24),
      wall(780, 470, 300, 24),
      wall(560, 200, 24, 90),
      wall(696, 200, 24, 90),
      wall(560, 420, 24, 90),
      wall(696, 420, 24, 90),
      crate(150, 330, 56, 56),
      crate(1074, 330, 56, 56),
      crate(560, 620, 60, 56),
    ],
    guards: [
      { path: [[200, 130], [1080, 130]], speed: 1, pause: 1.0 },
      { path: [[1080, 590], [200, 590]], speed: 1, pause: 1.0 },
      { path: [[640, 150], [640, 560]], speed: 0.9, pause: 1.6 },
    ],
    cameras: [
      { x: 300, y: 90, baseAngle: Math.PI / 2, range: 250 },
      { x: 980, y: 90, baseAngle: Math.PI / 2, range: 250 },
    ],
    loot: [vault(640, 360), gold(300, 150), gold(980, 150), gem(150, 580), gem(1130, 580), gold(640, 620)],
  },
  {
    name: LEVEL_NAMES[2],
    subtitle: 'The vault floor. Four guards, three cameras, one very large payday.',
    player: { x: 90, y: 620 },
    exit: { x: 1206, y: 315, w: 56, h: 90 },
    walls: [
      ...BORDER,
      wall(180, 170, 260, 24),
      wall(840, 170, 260, 24),
      wall(180, 520, 260, 24),
      wall(840, 520, 260, 24),
      wall(560, 170, 24, 80),
      wall(696, 170, 24, 80),
      wall(560, 470, 24, 80),
      wall(696, 470, 24, 80),
      wall(300, 330, 24, 120),
      wall(956, 330, 24, 120),
      crate(500, 330, 60, 60),
      crate(720, 330, 60, 60),
      crate(150, 330, 56, 56),
      crate(1074, 330, 56, 56),
    ],
    guards: [
      { path: [[200, 130], [1080, 130]], speed: 1.1, pause: 0.8 },
      { path: [[1080, 590], [200, 590]], speed: 1.1, pause: 0.8 },
      { path: [[480, 150], [480, 560]], speed: 1, pause: 1.2 },
      { path: [[800, 560], [800, 150]], speed: 1, pause: 1.2 },
    ],
    cameras: [
      { x: 300, y: 90, baseAngle: Math.PI / 2, range: 250 },
      { x: 640, y: 90, baseAngle: Math.PI / 2, range: 260 },
      { x: 980, y: 90, baseAngle: Math.PI / 2, range: 250 },
    ],
    loot: [vault(640, 360), gold(300, 130), gold(980, 130), gem(150, 150), gem(1130, 150), gem(150, 580), gem(1130, 580)],
  },
];
