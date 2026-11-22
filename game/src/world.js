// world.js — the heist itself: state, movement, loot, tools, the alarm, win/lose.
// Screens (title / playing / caught / level clear / won) are owned by main.js;
// this module only knows the floor, the thief, the guards, the cameras and the
// alarm meter, and reports events back as a plain object.
import { ALARM, CAMERA, GUARD, PLAYER, TOOLS } from './config.js';
import { LEVELS } from './levels.js';
import { dist, pointInRect, resolveCircleWalls } from './geometry.js';
import { makeGuard, updateGuard, guardSees, distractGuards } from './guards.js';
import { makeCamera, updateCamera, cameraSees } from './cameras.js';

export const EVENT_NONE = 0;
export const EVENT_LOOT = 1;
export const EVENT_VAULT = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_LEVEL_CLEAR = 8;
export const EVENT_COIN = 16;
export const EVENT_SMOKE = 32;

export function createGame() {
  const state = {
    screen: 'title', // title | playing | caught | levelclear | won | howto
    levelIndex: 0,
    time: 0,
    score: 0,
    totalScore: 0,
    alarm: 0,
    spotted: false,
    spottedBy: null, // 'guard' | 'camera' | null, for the HUD warning
    coins: TOOLS.coinStart,
    smokeLeft: TOOLS.smokeStart,
    lootTaken: 0,
    message: '',
    messageTime: 0,
    caughtBy: null,
    vaultProgress: 0,
    levelTime: 0,
    stepTimer: 0,
    tickTimer: 0,
  };
  loadLevel(state, 0);
  return state;
}

export function levelDef(state) { return LEVELS[state.levelIndex]; }

export function loadLevel(state, index) {
  const def = LEVELS[index];
  state.levelIndex = index;
  state.levelTime = 0;
  state.alarm = 0;
  state.spotted = false;
  state.spottedBy = null;
  state.coins = TOOLS.coinStart;
  state.smokeLeft = TOOLS.smokeStart;
  state.lootTaken = 0;
  state.vaultProgress = 0;
  state.message = '';
  state.messageTime = 0;
  state.caughtBy = null;
  state.player = { x: def.player.x, y: def.player.y, angle: -Math.PI / 2, moving: false };
  state.walls = def.walls.map((w) => ({ ...w }));
  state.guards = def.guards.map((g) => makeGuard(g));
  state.cameras = def.cameras.map((c, i) => makeCamera(c, i));
  state.loot = def.loot.map((l) => ({ ...l, taken: false }));
  state.exit = { ...def.exit };
  state.smokes = [];
  state.coinFlight = null; // {x0,y0,x1,y1,t}
  state.coinPing = null; // {x, y, t} fading ring where a coin landed
  state.totalLoot = state.loot.length;
}

export function allLootTaken(state) {
  return state.lootTaken >= state.totalLoot;
}

export function playerInSmoke(state) {
  for (const s of state.smokes) {
    if (dist(state.player.x, state.player.y, s.x, s.y) < TOOLS.smokeRadius * 0.85) return true;
  }
  return false;
}

function nearestVault(state) {
  for (const l of state.loot) {
    if (!l.taken && l.kind === 'vault' && dist(state.player.x, state.player.y, l.x, l.y) < 70) return l;
  }
  return null;
}

// One fixed step of the heist. `input` is the Input object; `sound` the SoundBank.
// Returns an events object; the caller (main.js) turns events into screens/sounds.
export function stepGame(state, input, dt, sound) {
  const events = { flags: EVENT_NONE, lootKind: null };
  state.levelTime += dt;
  state.time += dt;
  if (state.messageTime > 0) state.messageTime -= dt;

  // --- movement -----------------------------------------------------------
  const mv = input.moveVector();
  const sneaking = input.sneaking;
  const speed = sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const p = state.player;
  p.moving = mv.x !== 0 || mv.y !== 0;
  if (p.moving) {
    p.angle = Math.atan2(mv.y, mv.x);
    p.x += mv.x * speed * dt;
    p.y += mv.y * speed * dt;
    resolveCircleWalls(p, PLAYER.radius, state.walls);
    p.x = Math.max(24, Math.min(1256, p.x));
    p.y = Math.max(88, Math.min(696, p.y));
    state.stepTimer -= dt;
    if (state.stepTimer <= 0) {
      state.stepTimer = sneaking ? 0.55 : 0.34;
      if (sound) sound.step();
    }
  }

  // --- tools: coin throw (mouse click) and smoke (Q) -----------------------
  if (input.click && state.coins > 0 && !state.coinFlight) {
    const c = input.click;
    const d = dist(p.x, p.y, c.x, c.y);
    const range = Math.min(d, TOOLS.coinRange);
    const a = Math.atan2(c.y - p.y, c.x - p.x);
    const tx = p.x + Math.cos(a) * range;
    const ty = p.y + Math.sin(a) * range;
    state.coinFlight = { x0: p.x, y0: p.y, x1: tx, y1: ty, t: 0 };
    state.coins -= 1;
    events.flags |= EVENT_COIN;
    if (sound) sound.coin();
  }
  if (input.wasPressed('q') && state.smokeLeft > 0) {
    state.smokes.push({ x: p.x, y: p.y, t: TOOLS.smokeSeconds });
    state.smokeLeft -= 1;
    events.flags |= EVENT_SMOKE;
    if (sound) sound.smoke();
  }
  if (state.coinFlight) {
    const f = state.coinFlight;
    f.t += dt / TOOLS.coinFlightSeconds;
    if (f.t >= 1) {
      const heard = distractGuards(state.guards, f.x1, f.y1, TOOLS.coinNoiseRadius);
      state.coinPing = { x: f.x1, y: f.y1, t: 1.2 };
      state.coinFlight = null;
      state.message = heard > 0 ? 'Clink! A guard goes to look.' : 'Clink… nobody heard it.';
      state.messageTime = 2;
      if (sound) sound.coinLand();
    }
  }
  if (state.coinPing) {
    state.coinPing.t -= dt;
    if (state.coinPing.t <= 0) state.coinPing = null;
  }
  for (let i = state.smokes.length - 1; i >= 0; i--) {
    state.smokes[i].t -= dt;
    if (state.smokes[i].t <= 0) state.smokes.splice(i, 1);
  }

  // --- loot ----------------------------------------------------------------
  for (const l of state.loot) {
    if (l.taken || l.kind === 'vault') continue;
    if (dist(p.x, p.y, l.x, l.y) < 30) {
      l.taken = true;
      state.lootTaken += 1;
      state.score += l.kind === 'gem' ? 250 : 100;
      events.flags |= EVENT_LOOT;
      events.lootKind = l.kind;
      if (sound) sound.pickup();
    }
  }
  const vault = nearestVault(state);
  if (vault && input.interactHeld) {
    state.vaultProgress += dt;
    state.tickTimer -= dt;
    if (state.tickTimer <= 0) {
      state.tickTimer = 0.3;
      if (sound) sound.vaultTick();
    }
    if (state.vaultProgress >= TOOLS.vaultCrackSeconds) {
      vault.taken = true;
      state.lootTaken += 1;
      state.score += 500;
      state.vaultProgress = 0;
      events.flags |= EVENT_VAULT;
      state.message = 'Vault cracked! +500';
      state.messageTime = 2.5;
      if (sound) sound.vaultOpen();
    }
  } else if (state.vaultProgress > 0) {
    state.vaultProgress = Math.max(0, state.vaultProgress - dt * 1.5);
  }

  // --- guards and cameras ---------------------------------------------------
  const hidden = playerInSmoke(state);
  let maxSeen = 0;
  let seenBy = null;
  for (const g of state.guards) {
    updateGuard(g, dt, p, state.walls, hidden);
    g.seen = hidden ? 0 : guardSees(g, p, state.walls);
    if (g.seen > maxSeen) { maxSeen = g.seen; seenBy = 'guard'; }
    if (dist(g.x, g.y, p.x, p.y) < GUARD.touchCatchRadius) {
      state.caughtBy = 'A guard grabbed your collar.';
      events.flags |= EVENT_CAUGHT;
    }
  }
  for (const c of state.cameras) {
    updateCamera(c, dt);
    c.seen = hidden ? 0 : cameraSees(c, p, state.walls);
    if (c.seen > maxSeen) { maxSeen = c.seen; seenBy = 'camera'; }
  }
  state.spotted = maxSeen > 0.25;
  state.spottedBy = state.spotted ? seenBy : null;

  const sneakFactor = sneaking ? PLAYER.sneakSpotFactor : 1;
  if (maxSeen > 0) {
    const rate = seenBy === 'camera' ? CAMERA.spotRate : GUARD.spotRate;
    state.alarm = Math.min(100, state.alarm + rate * maxSeen * sneakFactor * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM.decayPerSecond * dt);
  }
  if (state.alarm >= 100 && !state.caughtBy) {
    state.caughtBy = 'The alarm hit 100% — the whole building woke up.';
    events.flags |= EVENT_CAUGHT;
  }

  // --- exit ------------------------------------------------------------------
  if (allLootTaken(state) && pointInRect(p.x, p.y, state.exit)) {
    const timeBonus = Math.max(0, Math.round(600 - state.levelTime * 5));
    state.score += timeBonus;
    events.flags |= EVENT_LEVEL_CLEAR;
    events.timeBonus = timeBonus;
  }
  return events;
}
