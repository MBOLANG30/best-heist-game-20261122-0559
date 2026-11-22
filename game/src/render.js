// render.js — everything the player sees, drawn with plain Canvas 2D.
// Draw order matters: floor, vision cones, walls (which cover cone parts behind
// them), loot and exit, smoke, guards and cameras, the thief, then the HUD and
// any screen overlay. All art is drawn in code — no images, no fonts from the
// network (system fonts only).
import { ALARM, CAMERA, COLORS, GUARD, PLAYER, TOOLS, VIEW } from './config.js';
import { LEVELS } from './levels.js';
import { dist } from './geometry.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'playing';
export const SCREEN_OVER = 'caught';
export const SCREEN_CLEAR = 'levelclear';
export const SCREEN_WON = 'won';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, state) {
  const def = LEVELS[state.levelIndex];
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, 64, VIEW.width, VIEW.height - 64);
  // Checker tiles.
  ctx.fillStyle = COLORS.floorB;
  const tile = 64;
  for (let ty = 64; ty < VIEW.height; ty += tile) {
    for (let tx = 0; tx < VIEW.width; tx += tile) {
      if (((tx / tile) + (ty / tile)) % 2 === 0) ctx.fillRect(tx, ty, tile, tile);
    }
  }
  // Carpet runner down the middle of each floor.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(540, 64, 200, VIEW.height - 64);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(540, 64, 200, VIEW.height - 64);
  // Tile grout.
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= VIEW.width; tx += tile) {
    ctx.beginPath(); ctx.moveTo(tx, 64); ctx.lineTo(tx, VIEW.height); ctx.stroke();
  }
  for (let ty = 64; ty <= VIEW.height; ty += tile) {
    ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(VIEW.width, ty); ctx.stroke();
  }
  void def;
}

function drawWalls(ctx, state) {
  for (const w of state.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = w.kind === 'crate' ? COLORS.crate : COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, Math.min(8, w.h));
    if (w.kind === 'crate') {
      ctx.fillStyle = COLORS.crateTop;
      ctx.fillRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
      ctx.strokeStyle = COLORS.crateEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
      ctx.beginPath();
      ctx.moveTo(w.x + 4, w.y + 4); ctx.lineTo(w.x + w.w - 4, w.y + w.h - 4);
      ctx.moveTo(w.x + w.w - 4, w.y + 4); ctx.lineTo(w.x + 4, w.y + w.h - 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }
  }
}

function drawLoot(ctx, state, now) {
  for (const l of state.loot) {
    if (l.taken) continue;
    const bob = Math.sin(now / 300 + l.x) * 3;
    if (l.kind === 'vault') {
      // The vault: a brass safe with a dial, ringed in gold while it waits.
      ctx.save();
      ctx.translate(l.x, l.y + bob * 0.3);
      ctx.fillStyle = COLORS.vaultDoor;
      rr(ctx, -34, -30, 68, 60, 8);
      ctx.fill();
      ctx.strokeStyle = '#6e5518';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#2a2113';
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9, -9); ctx.stroke();
      ctx.fillStyle = '#fff3b0';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VAULT', 0, -38);
      ctx.restore();
      // Crack progress ring.
      if (state.vaultProgress > 0) {
        ctx.strokeStyle = '#ffd94d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 44, -Math.PI / 2, -Math.PI / 2 + (state.vaultProgress / TOOLS.vaultCrackSeconds) * Math.PI * 2);
        ctx.stroke();
      }
      continue;
    }
    ctx.save();
    ctx.translate(l.x, l.y + bob);
    if (l.kind === 'gem') {
      ctx.fillStyle = COLORS.lootGem;
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(6, -2); ctx.lineTo(-6, -2);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = COLORS.lootGold;
      ctx.fillRect(-13, -8, 26, 16);
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(-13, -8, 26, 5);
      ctx.strokeStyle = '#8a6a1d';
      ctx.lineWidth = 2;
      ctx.strokeRect(-13, -8, 26, 16);
    }
    ctx.restore();
  }
}

function drawExit(ctx, state, now) {
  const e = state.exit;
  const open = state.lootTaken >= state.totalLoot;
  const pulse = open ? 0.6 + 0.4 * Math.sin(now / 220) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = open ? COLORS.exitOpen : COLORS.exitClosed;
  rr(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = open ? '#c9ffe2' : '#1d3a2a';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#06281a';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 4);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(open ? 'GO! GO! GO!' : `${state.totalLoot - state.lootTaken} loot left`, e.x + e.w / 2, e.y + e.h + 16);
}

function drawGuard(ctx, g, now) {
  const alert = g.seen > 0.25;
  ctx.save();
  ctx.translate(g.x, g.y);
  // Body: a night-shift guard in a mustard jacket, with a cap.
  ctx.fillStyle = alert ? '#ff5a4d' : COLORS.guardBody;
  ctx.beginPath(); ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.guardDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#2b2620';
  ctx.beginPath(); ctx.arc(0, -3, 8, 0, Math.PI * 2); ctx.fill(); // head
  ctx.fillStyle = alert ? '#ff5a4d' : COLORS.guardBody;
  ctx.fillRect(-9, -11, 18, 5); // cap brim
  // Facing tick.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(g.angle) * 20, Math.sin(g.angle) * 20);
  ctx.stroke();
  ctx.restore();
  if (g.mode === 'investigate') {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 26);
  }
  if (alert) {
    ctx.fillStyle = '#ff5a4d';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 26);
  }
  void now;
}

function drawCamera(ctx, c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.fillStyle = COLORS.cameraBody;
  rr(ctx, -4, -7, 22, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#ff8a8a';
  ctx.beginPath(); ctx.arc(19, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.arc(c.x, c.y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPlayer(ctx, state, now) {
  const p = state.player;
  const sneaking = state.sneaking;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 10, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Cloak: a hooded thief in midnight blue.
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath(); ctx.arc(0, 0, PLAYER.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#16294f';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.playerHood;
  ctx.beginPath(); ctx.arc(0, -2, 8, 0, Math.PI * 2); ctx.fill();
  // Eyes + facing tick.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(Math.cos(p.angle) * 4 - 2.5, Math.sin(p.angle) * 4 - 2.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(Math.cos(p.angle) * 4 + 2.5, Math.sin(p.angle) * 4 + 2.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (sneaking) {
    ctx.fillStyle = 'rgba(160,190,255,0.9)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', p.x, p.y - 22);
  }
  void now;
}

function drawSmoke(ctx, state) {
  for (const s of state.smokes) {
    const alpha = Math.min(1, s.t / 1.5) * 0.55;
    ctx.fillStyle = `rgba(200, 205, 220, ${alpha})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, TOOLS.smokeRadius, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x - 40, s.y + 18, TOOLS.smokeRadius * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x + 42, s.y - 14, TOOLS.smokeRadius * 0.6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCoin(ctx, state, now) {
  if (state.coinFlight) {
    const f = state.coinFlight;
    const x = f.x0 + (f.x1 - f.x0) * f.t;
    const y = f.y0 + (f.y1 - f.y0) * f.t - Math.sin(f.t * Math.PI) * 34;
    ctx.fillStyle = COLORS.lootGold;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a1d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (state.coinPing) {
    const ping = state.coinPing;
    const r = (1.2 - ping.t) * 90;
    ctx.strokeStyle = `rgba(255, 217, 77, ${Math.max(0, ping.t / 1.2)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ping.x, ping.y, Math.max(4, r), 0, Math.PI * 2); ctx.stroke();
  }
  void now;
}

function alarmColor(v) {
  if (v >= ALARM.dangerAt) return COLORS.alarmHigh;
  if (v >= 35) return COLORS.alarmMid;
  return COLORS.alarmLow;
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudPanel;
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.fillStyle = COLORS.hudText;
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`THE GILDED VAULT — ${LEVELS[state.levelIndex].name}`, 18, 26);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText(`Score ${state.score}   •   Loot ${state.lootTaken}/${state.totalLoot}   •   Coins ${state.coins}   •   Smoke ${state.smokeLeft}   •   ${Math.floor(state.levelTime / 60)}:${String(Math.floor(state.levelTime % 60)).padStart(2, '0')}`, 18, 48);

  // The alarm meter: big, labelled, impossible to miss.
  const mx = 860;
  const mw = 300;
  ctx.fillStyle = '#000';
  ctx.fillRect(mx - 2, 12, mw + 4, 40);
  ctx.fillStyle = '#241a1a';
  ctx.fillRect(mx, 14, mw, 36);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(mx, 14, (mw * state.alarm) / 100, 36);
  ctx.strokeStyle = state.alarm >= ALARM.dangerAt ? '#ff8080' : '#888';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, 14, mw, 36);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 3;
  ctx.strokeText(`ALARM ${Math.floor(state.alarm)}%`, mx + mw / 2, 38);
  ctx.fillText(`ALARM ${Math.floor(state.alarm)}%`, mx + mw / 2, 38);
  ctx.textAlign = 'left';

  if (state.spotted) {
    const blink = Math.floor(performance.now() / 180) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.spottedBy === 'camera' ? 'SPOTTED BY CAMERA!' : 'SPOTTED! BREAK LINE OF SIGHT!', VIEW.width / 2, 96);
      ctx.textAlign = 'left';
    }
  }
  if (state.messageTime > 0) {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW.width / 2, VIEW.height - 16);
    ctx.textAlign = 'left';
  }
}

function overlay(ctx, lines, accent) {
  ctx.fillStyle = 'rgba(8, 7, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  let y = 190;
  for (const line of lines) {
    ctx.fillStyle = line.color || COLORS.hudText;
    ctx.font = line.font || '20px system-ui, sans-serif';
    ctx.fillText(line.text, VIEW.width / 2, y);
    y += line.gap || 36;
  }
  void accent;
}

export function drawWorld(ctx, state, now) {
  drawFloor(ctx, state);
  // Vision cones first, so walls drawn over them hide the parts behind cover.
  for (const g of state.guards) {
    drawCone(ctx, g.x, g.y, g.angle, GUARD.visionHalfAngle, GUARD.visionRange,
      g.seen > 0.25 ? COLORS.coneSeen : COLORS.coneGuard,
      g.seen > 0.25 ? 'rgba(255,60,60,0.8)' : COLORS.coneGuardEdge);
  }
  for (const c of state.cameras) {
    drawCone(ctx, c.x, c.y, c.angle, CAMERA.visionHalfAngle, c.range,
      c.seen > 0.25 ? COLORS.coneSeen : COLORS.coneCamera,
      c.seen > 0.25 ? 'rgba(255,60,60,0.8)' : COLORS.coneCameraEdge);
  }
  drawWalls(ctx, state);
  drawExit(ctx, state, now);
  drawLoot(ctx, state, now);
  drawSmoke(ctx, state);
  drawCoin(ctx, state, now);
  for (const g of state.guards) drawGuard(ctx, g, now);
  for (const c of state.cameras) drawCamera(ctx, c);
  drawPlayer(ctx, state, now);
  drawHud(ctx, state);
}

export function render(ctx, state, now) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (state.screen === SCREEN_TITLE) {
    drawWorld(ctx, state, now);
    overlay(ctx, [
      { text: 'THE GILDED VAULT', font: 'bold 64px system-ui, sans-serif', color: '#ffd94d', gap: 76 },
      { text: 'A three-floor stealth heist. No guns, no alarms — if you can help it.', font: '20px system-ui, sans-serif', gap: 34 },
      { text: 'WASD / arrows — move    •    Shift — sneak    •    Click — throw a coin', font: '18px system-ui, sans-serif', gap: 30 },
      { text: 'Q — smoke bomb    •    E (hold) — crack the vault    •    M — mute', font: '18px system-ui, sans-serif', gap: 30 },
      { text: 'Grab every piece of loot, then reach the green EXIT before the alarm hits 100%.', font: '18px system-ui, sans-serif', color: '#ffe9a8', gap: 52 },
      { text: 'Press ENTER or click to start', font: 'bold 24px system-ui, sans-serif', color: '#39d98a' },
    ]);
    return;
  }
  if (state.screen === 'howto') {
    drawWorld(ctx, state, now);
    overlay(ctx, [
      { text: 'HOW TO HEIST', font: 'bold 44px system-ui, sans-serif', color: '#ffd94d', gap: 60 },
      { text: 'Guards patrol fixed routes and watch yellow cones. Cameras sweep red cones.', font: '19px system-ui, sans-serif', gap: 32 },
      { text: 'Being seen fills the ALARM meter. Break line of sight and it drains again.', font: '19px system-ui, sans-serif', gap: 32 },
      { text: 'A thrown coin pulls nearby guards away to investigate. Smoke hides you.', font: '19px system-ui, sans-serif', gap: 32 },
      { text: 'The vault only opens if you stand beside it and hold E. The exit only opens', font: '19px system-ui, sans-serif', gap: 32 },
      { text: 'once every piece of loot is taken. Three floors — the last one pays best.', font: '19px system-ui, sans-serif', gap: 52 },
      { text: 'Press ENTER to start — H to come back here', font: 'bold 22px system-ui, sans-serif', color: '#39d98a' },
    ]);
    return;
  }
  drawWorld(ctx, state, now);
  if (state.screen === SCREEN_OVER) {
    overlay(ctx, [
      { text: 'CAUGHT!', font: 'bold 64px system-ui, sans-serif', color: '#ff4d4d', gap: 76 },
      { text: state.caughtBy || 'The heist is over.', font: '20px system-ui, sans-serif', gap: 40 },
      { text: `Floor ${state.levelIndex + 1} — score ${state.score} — loot ${state.lootTaken}/${state.totalLoot}`, font: '18px system-ui, sans-serif', gap: 52 },
      { text: 'Press R to try the floor again', font: 'bold 24px system-ui, sans-serif', color: '#39d98a' },
    ]);
  } else if (state.screen === SCREEN_CLEAR) {
    overlay(ctx, [
      { text: 'CLEAN GETAWAY!', font: 'bold 56px system-ui, sans-serif', color: '#39d98a', gap: 70 },
      { text: `${LEVELS[state.levelIndex].name} cleared — score ${state.score}`, font: '20px system-ui, sans-serif', gap: 40 },
      { text: state.levelIndex + 1 < LEVELS.length ? 'Press ENTER for the next floor' : 'Press ENTER to see the final take', font: 'bold 24px system-ui, sans-serif', color: '#ffd94d' },
    ]);
  } else if (state.screen === SCREEN_WON) {
    overlay(ctx, [
      { text: 'THE GILDED VAULT IS YOURS', font: 'bold 48px system-ui, sans-serif', color: '#ffd94d', gap: 64 },
      { text: `All three floors cleared. Final take: ${state.totalScore} points.`, font: '22px system-ui, sans-serif', gap: 40 },
      { text: 'No alarms that mattered. The crew eats well tonight.', font: '19px system-ui, sans-serif', gap: 52 },
      { text: 'Press R to run it all back', font: 'bold 24px system-ui, sans-serif', color: '#39d98a' },
    ]);
  }
}
