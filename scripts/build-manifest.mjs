// Regenerates manifest.json from whatever is actually on disk.
//
// The manifest is what the site reads, so a file that isn't listed in it does
// not exist as far as the jukebox is concerned. Keeping it by hand meant every
// upload through the GitHub web UI silently failed to show up. This scans the
// tree instead, so the files are the source of truth.
//
//   node scripts/build-manifest.mjs           # write manifest.json
//   node scripts/build-manifest.mjs --check   # fail if it would change (CI)
//
// Titles come from titles.json when an entry exists there, otherwise they're
// derived from the filename and the folder's artist. To rename a track in the
// UI, add it to titles.json — don't rename the file, since the URL is public.

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const AUDIO = /\.(mp3|wav|m4a|ogg|flac)$/i;
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

// folder → artist prefix for auto-derived titles
const ARTISTS = {
  'music/tanky': 'Tanky Johnson',
  'music/shmorez': 'Shmorez',
  'music/driftwave': 'DriftWave Static',
};

// play order: these folders in this order, root tracks first
const ORDER = ['music', 'music/tanky', 'music/shmorez', 'music/driftwave'];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(relative(ROOT, p));
  }
  return out;
}

const titles = JSON.parse(readFileSync(join(ROOT, 'titles.json'), 'utf8'));
const all = walk(join(ROOT, 'music')).map((p) => p.split(/[\\/]/).join('/'));

const audio = all.filter((p) => AUDIO.test(p));
const dirOf = (p) => p.slice(0, p.lastIndexOf('/'));

// Curated tracks keep the order they appear in titles.json; everything else is
// appended alphabetically, so a new upload lands at the end of its section
// rather than shuffling the existing run order.
const curated = Object.keys(titles);
const rank = (p) => {
  const d = ORDER.indexOf(dirOf(p));
  const c = curated.indexOf(p);
  return [d === -1 ? ORDER.length : d, c === -1 ? Number.MAX_SAFE_INTEGER : c, p.toLowerCase()];
};
audio.sort((a, b) => {
  const [ax, ay, az] = rank(a), [bx, by, bz] = rank(b);
  return ax - bx || ay - by || az.localeCompare(bz);
});

const derive = (p) => {
  const base = p.slice(p.lastIndexOf('/') + 1).replace(AUDIO, '');
  const pretty = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const artist = ARTISTS[dirOf(p)];
  return artist ? `${artist} — ${pretty}` : pretty;
};

const manifest = {
  version: 1,
  tracks: audio.map((src) => ({ src, title: titles[src] ?? derive(src) })),
  covers: all.filter((p) => IMAGE.test(p) && /\/(cover|logo)-/.test(p)).sort(),
};

const next = JSON.stringify(manifest, null, 2) + '\n';
const path = join(ROOT, 'manifest.json');

if (process.argv.includes('--check')) {
  const cur = readFileSync(path, 'utf8');
  if (cur !== next) {
    console.error('manifest.json is stale — run: node scripts/build-manifest.mjs');
    process.exit(1);
  }
  console.log(`manifest.json up to date (${manifest.tracks.length} tracks)`);
} else {
  writeFileSync(path, next);
  console.log(`wrote manifest.json — ${manifest.tracks.length} tracks, ${manifest.covers.length} covers`);
}
