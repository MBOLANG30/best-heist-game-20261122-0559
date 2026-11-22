// shots.js — deterministic screenshot scenes, staged from the real game state.
// Each scene is the live game (same levels, same guards, same renderer) posed
// at a fixed moment, so a screenshot is a true render of the game and the same
// URL always gives the same frame. No separate mock scene is ever drawn.
//   ?shot=title  — title screen over the Gallery Wing, guards mid-patrol
//   ?shot=cover  — mid-heist on the Gallery Wing: thief mid-room, cones sweeping,
//                  cameras live, vault + loot in frame, alarm at 38%
//   ?shot=caught — the fair caught moment: alarm at 100%, guard on the thief
//   ?shot=win    — the final take: all three floors cleared
import { updateGuard } from './guards.js';
import { updateCamera } from './cameras.js';
import { loadLevel } from './world.js';

// Advance patrols and camera sweeps by fixed steps so the pose is mid-motion.
function advance(state, seconds) {
  const step = 1 / 60;
  for (let t = 0; t < seconds; t += step) {
    for (const g of state.guards) updateGuard(g, step, state.player, state.walls, false);
    for (const c of state.cameras) updateCamera(c, step);
  }
}

export function stageShot(name, state) {
  if (name === 'cover') {
    loadLevel(state, 1); // the Gallery Wing: vault, 3 guards, 2 cameras
    state.screen = 'playing';
    // The thief, mid-room on the carpet, one vault-crack away from the big score.
    state.player.x = 640;
    state.player.y = 500;
    state.player.angle = -Math.PI / 2;
    state.alarm = 38;
    state.coins = 3;
    state.smokeLeft = 1;
    state.score = 350;
    // Two pieces already pocketed, the vault and the rest still on the floor.
    state.loot[1].taken = true;
    state.loot[4].taken = true;
    state.lootTaken = 2;
    // Pose the guards mid-patrol with their cones sweeping toward the room.
    advance(state, 7.3);
    state.guards[0].angle = Math.PI / 2 + 0.3;
    state.guards[1].angle = -Math.PI / 2 - 0.25;
    state.guards[2].x = 640;
    state.guards[2].y = 250;
    state.guards[2].angle = Math.PI / 2;
    state.cameras[0].time = 2.1;
    state.cameras[1].time = 0.6;
    updateCamera(state.cameras[0], 0);
    updateCamera(state.cameras[1], 0);
    return 'cover';
  }
  if (name === 'caught') {
    loadLevel(state, 0);
    state.screen = 'caught';
    state.alarm = 100;
    state.player.x = 640;
    state.player.y = 330;
    state.guards[0].x = 668;
    state.guards[0].y = 330;
    state.guards[0].angle = Math.PI;
    state.guards[0].seen = 1;
    state.caughtBy = 'A guard grabbed your collar.';
    state.score = 200;
    state.lootTaken = 2;
    state.loot[0].taken = true;
    state.loot[2].taken = true;
    advance(state, 2);
    return 'caught';
  }
  if (name === 'win') {
    loadLevel(state, 2);
    state.screen = 'won';
    state.totalScore = 4850;
    state.score = 4850;
    state.alarm = 12;
    for (const l of state.loot) l.taken = true;
    state.lootTaken = state.totalLoot;
    state.player.x = 1150;
    state.player.y = 360;
    state.player.angle = Math.PI;
    advance(state, 5);
    return 'win';
  }
  // Default: the title screen, posed over a live floor.
  loadLevel(state, 1);
  state.screen = 'title';
  advance(state, 4.5);
  return 'title';
}
