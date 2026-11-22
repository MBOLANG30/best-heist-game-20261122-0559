// main.js — boot, the frame loop, and the screens between heists.
// Owns: canvas setup, the requestAnimationFrame loop, screen transitions
// (title / how-to / playing / caught / level clear / won), the alarm hum, and
// the deterministic ?shot= mode used for screenshots. The rules live in
// world.js; the drawing lives in render.js; this file only connects them.
import { VIEW } from './config.js';
import { LEVELS } from './levels.js';
import { ALARM } from './config.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import {
  createGame, loadLevel, stepGame,
  EVENT_CAUGHT, EVENT_LEVEL_CLEAR, EVENT_VAULT,
} from './world.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const input = new Input(canvas);
const sound = new SoundBank();
const state = createGame();
state.sneaking = false; // refreshed every frame from the input

// Test hook: headless play-tests drive the game through this handle.
window.__game = { state, input, sound };

function startLevel(index) {
  loadLevel(state, index);
  state.screen = 'playing';
  state.paused = false;
}

function startGame() {
  state.score = 0;
  state.totalScore = 0;
  startLevel(0);
}

function onCaught() {
  state.screen = 'caught';
  sound.stopAlarm();
  sound.caught();
}

function onLevelClear(timeBonus) {
  state.totalScore = state.score;
  sound.stopAlarm();
  sound.win();
  if (state.levelIndex + 1 >= LEVELS.length) {
    state.screen = 'won';
  } else {
    state.screen = 'levelclear';
  }
  void timeBonus;
}

// --- deterministic screenshot mode ------------------------------------------
// ?shot=title|cover|caught|win stages a fixed frame and renders it once.
// No loop, no timers, no audio: the same URL always paints the same pixels.
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  stageShot(shotName, state);
  render(ctx, state, 1000);
  document.title = 'shot-ready';
  window.__shotReady = true;
} else {
  let last = performance.now();
  let paused = false;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Screen transitions (edge-triggered keys).
    if (input.wasPressed('enter', ' ')) {
      if (state.screen === 'title' || state.screen === 'howto') {
        sound.ensure();
        sound.click();
        startGame();
      } else if (state.screen === 'levelclear') {
        sound.click();
        startLevel(state.levelIndex + 1);
      } else if (state.screen === 'won') {
        sound.click();
        startGame();
      }
    }
    if (input.wasPressed('h') && (state.screen === 'title' || state.screen === 'howto')) {
      state.screen = state.screen === 'title' ? 'howto' : 'title';
      sound.click();
    }
    if (input.wasPressed('r') && (state.screen === 'caught' || state.screen === 'won')) {
      sound.click();
      if (state.screen === 'won') startGame();
      else startLevel(state.levelIndex);
    }
    if (input.wasPressed('m')) {
      sound.ensure();
      sound.toggleMute();
    }
    if (input.wasPressed('p') && state.screen === 'playing') paused = !paused;
    if (input.click && (state.screen === 'title' || state.screen === 'howto')) {
      sound.ensure();
      sound.click();
      startGame();
    }
    if (input.click && state.screen === 'levelclear') {
      sound.click();
      startLevel(state.levelIndex + 1);
    }

    if (state.screen === 'playing' && !paused) {
      state.sneaking = input.sneaking;
      const events = stepGame(state, input, dt, sound);
      if (events.flags & EVENT_VAULT) {
        // vault sound already played inside stepGame
      }
      if (events.flags & EVENT_CAUGHT) onCaught();
      else if (events.flags & EVENT_LEVEL_CLEAR) onLevelClear(events.timeBonus);
      // The alarm hum only while the meter is in the danger zone.
      if (state.alarm >= ALARM.dangerAt) sound.startAlarm();
      else sound.stopAlarm();
    } else if (state.screen !== 'playing') {
      sound.stopAlarm();
    }

    render(ctx, state, now);
    if (paused && state.screen === 'playing') {
      ctx.fillStyle = 'rgba(8, 7, 14, 0.6)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      ctx.fillStyle = '#f2ead8';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED — press P to continue', VIEW.width / 2, VIEW.height / 2);
      ctx.textAlign = 'left';
    }
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Announce state changes for screen readers.
const status = document.getElementById('status');
if (status) {
  setInterval(() => {
    if (state.screen === 'playing') {
      status.textContent = `Playing ${LEVELS[state.levelIndex].name}. Alarm ${Math.floor(state.alarm)} percent. Loot ${state.lootTaken} of ${state.totalLoot}.`;
    } else {
      status.textContent = `The Gilded Vault: ${state.screen}.`;
    }
  }, 2000);
}
