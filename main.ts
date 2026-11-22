// The Gilded Vault — a 2D top-down stealth heist game for make.fun.
// main.ts (Node 22, standard library only) hands the entry in: it copies the
// playable game/ folder and the screenshots/ folder from beside this file
// into the output directory and writes /output/dossier.json with the vendored
// make.fun library. It never touches the network and never deletes the output
// directory itself — only the files and folders inside it are cleared, so a
// grader that mounts /output keeps working. Two runs write identical bytes:
// the copy is a plain file copy and the dossier is canonical JSON.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a clear error when the entry is incomplete, instead of
// handing the grader a half-copied tree.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('main.ts: game/index.html is missing beside this file');
}

// Clear only the *contents* of the output directory, never the directory itself.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
