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

// artist folder → display name. A folder nested one level deeper is an album:
// music/tanky/for-momma/01 Long Way Home.mp3 is Tanky Johnson, album "For Momma".
const ARTISTS = {
  'music/tanky': 'Tanky Johnson',
  'music/shmorez': 'Shmorez',
  'music/driftwave': 'DriftWave Static',
};

// album folder → display name. Anything not listed falls back to the folder
// name with dashes turned into spaces, so a new album folder still works.
const ALBUMS = {
  'music/tanky/for-momma': 'For Momma',
  'music/tanky/the-ballad-of-kanye-twitty': 'The Ballad of Kanye Twitty',
  'music/tanky/friday-nights-and-neon-lights': 'Friday Nights and Neon Lights',
  'music/tanky/homer-simpson-last-call-lullabies': 'Homer Simpson - Last Call Lullabies',
  'music/shmorez/shmorez-is-hungry': 'Shmorez is Hungry',
  'music/shmorez/damn-shmorez-whered-you-find-this': "Damn Shmorez Where'd You Find This",
  'music/shmorez/thuggish-ruggish-shmorez': 'Thuggish Ruggish Shmorez',
  'music/driftwave/booting-dreamOS-bardo-factory-reset': 'Booting.dreamOS bardo // factory_reset',
};

// play order: these artist folders in this order, root tracks first
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

// A track sits either directly in an artist folder or one level deeper, in an
// album folder. Walk up until we hit a known artist so both shapes work.
const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
function context(p) {
  const dir = dirOf(p);
  if (ARTISTS[dir]) return { artistDir: dir, artist: ARTISTS[dir], album: null };
  const parent = dirOf(dir);
  if (ARTISTS[parent]) {
    return {
      artistDir: parent,
      artist: ARTISTS[parent],
      album: ALBUMS[dir] ?? titleCase(dir.slice(dir.lastIndexOf('/') + 1)),
    };
  }
  return { artistDir: dir, artist: null, album: null };
}

// Curated tracks keep the order they appear in titles.json; everything else is
// appended alphabetically, so a new upload lands at the end of its section
// rather than shuffling the existing run order.
const curated = Object.keys(titles);
// Album tracks sort by path so the leading "01 ", "02 " keeps them in running
// order, and they're never reordered by titles.json.
const rank = (p) => {
  const { artistDir, album } = context(p);
  const d = ORDER.indexOf(artistDir);
  const c = album ? -1 : curated.indexOf(p);
  return [
    d === -1 ? ORDER.length : d,
    album ? 1 : 0,                                    // loose singles before albums
    c === -1 ? Number.MAX_SAFE_INTEGER : c,
    p.toLowerCase(),
  ];
};
audio.sort((a, b) => {
  const A = rank(a), B = rank(b);
  return A[0] - B[0] || A[1] - B[1] || A[2] - B[2] || A[3].localeCompare(B[3]);
});

const derive = (p) => {
  const base = p.slice(p.lastIndexOf('/') + 1).replace(AUDIO, '');
  // drop a leading track number on album files — it's ordering, not the title
  const pretty = base.replace(/^\d{1,2}[\s.\-_]+/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const { artist } = context(p);
  return artist ? `${artist} — ${pretty}` : pretty;
};

const manifest = {
  version: 1,
  tracks: audio.map((src) => {
    const { album } = context(src);
    const entry = { src, title: titles[src] ?? derive(src) };
    if (album) entry.album = album;
    return entry;
  }),
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
