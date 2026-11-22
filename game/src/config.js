// config.js — every tuning number and colour for The Gilded Vault, in one place.
// Nothing here knows about the DOM or the game loop; the other modules read these.
export const VIEW = { width: 1280, height: 720 };

export const PLAYER = {
  radius: 14,
  walkSpeed: 205,
  sneakSpeed: 105,
  // How much slower the alarm fills while sneaking.
  sneakSpotFactor: 0.45,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 78,
  investigateSpeed: 118,
  chaseSpeed: 0, // guards never chase: they raise the alarm instead (fair caught moment)
  visionRange: 235,
  visionHalfAngle: 0.62, // ~35.5 degrees each side
  // Alarm points per second while the thief is inside a cone, at point blank.
  spotRate: 46,
  // Alarm also rises a little just for being close and seen.
  touchCatchRadius: 26,
  investigatePause: 2.4,
};

export const CAMERA = {
  visionRange: 250,
  visionHalfAngle: 0.42,
  spotRate: 58,
  sweepSpeed: 0.55, // radians per second of the sweeping cone
  sweepArc: 0.9, // radians either side of the base angle
};

export const TOOLS = {
  coinStart: 4,
  coinRange: 420,
  coinNoiseRadius: 190,
  coinFlightSeconds: 0.45,
  smokeStart: 2,
  smokeRadius: 95,
  smokeSeconds: 5,
  vaultCrackSeconds: 2.6,
};

export const ALARM = {
  decayPerSecond: 7,
  // The meter flashes red above this value.
  dangerAt: 65,
};

export const COLORS = {
  floorA: '#1c1a26',
  floorB: '#211e2e',
  floorLine: '#2e2a40',
  carpet: '#4a2436',
  carpetEdge: '#6b3049',
  wall: '#3a3550',
  wallTop: '#4d4770',
  crate: '#5a4632',
  crateTop: '#7a6248',
  crateEdge: '#3d2f21',
  coneGuard: 'rgba(255, 196, 66, 0.20)',
  coneGuardEdge: 'rgba(255, 196, 66, 0.55)',
  coneCamera: 'rgba(255, 92, 92, 0.16)',
  coneCameraEdge: 'rgba(255, 92, 92, 0.5)',
  coneSeen: 'rgba(255, 60, 60, 0.34)',
  guardBody: '#e8b13c',
  guardDark: '#8a6a1d',
  cameraBody: '#c94f4f',
  lootGold: '#ffd94d',
  lootGem: '#5fe8d4',
  vaultDoor: '#b08d3e',
  exitClosed: '#3f7d5a',
  exitOpen: '#39d98a',
  playerCloak: '#3d6fe0',
  playerHood: '#274a9e',
  smoke: 'rgba(200, 205, 220, 0.30)',
  hudPanel: 'rgba(10, 9, 18, 0.82)',
  hudText: '#f2ead8',
  hudDim: '#a89f8d',
  alarmLow: '#39d98a',
  alarmMid: '#ffc442',
  alarmHigh: '#ff4d4d',
};

// How many loot pieces each level holds is derived from its loot list; the exit
// only opens once every piece (including the vault) is taken.
export const LEVEL_NAMES = ['The Marble Lobby', 'The Gallery Wing', 'The Gilded Vault'];
