# media

Media assets for [12matt3r // The Festival](https://github.com/hungryshmorez/Site),
served over GitHub Pages as a CDN.

The site does not bundle these files. It reads `manifest.json` from here at
runtime, so **adding music needs no site rebuild and no code change.**

## Adding a song

**Drop the file in `music/` (or `music/tanky/`, `music/shmorez/`, …) and that's
it.** Upload through the GitHub web UI if you like — no command line needed.

A workflow regenerates `manifest.json` on every push that touches `music/`, so
the track is in the playlist about a minute later. Nothing in the Site repo has
to change and nothing has to be rebuilt.

Name the file whatever you want. Spaces, capitals and apostrophes are fine —
the site percent-encodes each path segment. Don't rename a file after it's
published, though: the URL is public and renaming breaks any existing link.

### Albums

A folder one level inside an artist folder is an album:

```
music/tanky/for-momma/01 Long Way Home.mp3
music/tanky/for-momma/02 Bottled Up Regrets.mp3
```

Prefix the files `01 `, `02 ` … and they play in that order — album tracks sort
by filename and ignore the `titles.json` ordering, so the running order is
whatever the numbers say. The album name is taken from the folder (dashes
become spaces); add it to `ALBUMS` in `scripts/build-manifest.mjs` for exact
capitalisation like *The Ballad of Kanye Twitty*.

Loose singles can stay directly in the artist folder; they play before the
albums.

### Track titles

By default the title is the filename (minus the extension, dashes and
underscores turned into spaces) with the folder's artist in front, so
`music/shmorez/Jump 2026.mp3` becomes **Shmorez — Jump 2026**.

To override it, add an entry to `titles.json`:

```json
{ "music/shmorez/Jump 2026.mp3": "Shmorez — JUMP! (2026 mix)" }
```

Entries in `titles.json` also fix the play order — they run first, in the order
listed. Anything not listed is appended alphabetically within its folder, so a
new upload lands at the end of its section instead of reshuffling the tape.

### Doing it by hand

```bash
node scripts/build-manifest.mjs           # rewrite manifest.json
node scripts/build-manifest.mjs --check   # fail if stale (what CI runs)
```

## Album art

Anything listed under `covers` is cycled on the jukebox screen. Same deal —
add the image to `music/art/` and add its path to the array.

## Layout

```
manifest.json        the playlist the site reads — GENERATED, don't hand-edit
titles.json          title overrides + play order for curated tracks
scripts/             the manifest generator
music/               the slushwave tape
music/art/           album art and backdrops
music/tanky/         Tanky Johnson
music/shmorez/       Shmorez
music/driftwave/     DriftWave Static
video/               the billboard clip
```

## Notes

- **Keep this repo public.** Pages won't serve it for free otherwise, and the
  site fetches it cross-origin.
- **No per-file size limit** worth worrying about, but the whole published site
  must stay under **1GB** and Pages has a **100GB/month** bandwidth soft limit.
- Files here are also copies of tracks that live in the Site repo's EPK folders,
  because each EPK page has its own player that loads them by relative path.
  Editing one does not update the other.
